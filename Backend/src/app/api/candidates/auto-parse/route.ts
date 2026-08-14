import { NextRequest } from "next/server";
import { routeHandler } from "@/shared/utils/route-handler";
import { createdResponse } from "@/shared/utils/api-response";
import { prisma } from "@/infrastructure/database/prisma.client";
import { vercelBlobStorage } from "@/infrastructure/storage/vercel-blob.storage";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { AppError } from "@/shared/errors";
import { APP_CONSTANTS } from "@/config";
import { createModuleLogger } from "@/shared/utils/logger";
// NEW: Import the applications service
import { applicationsService } from "@/modules/applications/applications.service";

const logger = createModuleLogger("auto-parse");

/**
 * POST /api/candidates/auto-parse
 * Upload a resume file, parse it with AI, and automatically create a candidate record.
 */
export const POST = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER"] },
  async (req: NextRequest, { auth }) => {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetJobId = formData.get("targetJobId") as string | null;
    const existingJobId = formData.get("jobId") as string | null;

    if (!file) {
      throw new AppError("No file provided", 400, "FILE_REQUIRED");
    }

    // Validate file type
    if (!(APP_CONSTANTS.ALLOWED_RESUME_TYPES as readonly string[]).includes(file.type)) {
      throw new AppError(
        "Invalid file type. Only PDF and DOCX files are allowed.",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    const existingJobId = formData.get("jobId") as string | null;
    // NEW: Get the target job ID
    const applyToJobId = formData.get("applyToJobId") as string | null;

    // 0. Create or Get ParsingJob
    let parsingJob;
    if (existingJobId) {
      parsingJob = await prisma.parsingJob.findUnique({ where: { id: existingJobId } });
    }
    
    if (!parsingJob) {
      parsingJob = await prisma.parsingJob.create({
        data: {
          fileName: file.name,
          status: "PENDING",
          companyId: auth.companyId,
        }
      });
    }

    try {
      await prisma.parsingJob.update({
        where: { id: parsingJob.id },
        data: { status: "PARSING", startedAt: new Date() }
      });

      // Buffer the file so it can be read multiple times (stream consumption fix)
      const fileBuffer = await file.arrayBuffer();
      const fileForAi = new File([fileBuffer], file.name, { type: file.type });
      const fileForStorage = new File([fileBuffer], file.name, { type: file.type });

      // Parse the resume using the Python AI agent
      logger.info({ fileName: file.name }, "Sending PDF to AI agent for parsing");
      const aiParsedData = await aiClient.uploadAndParseResume(fileForAi);

      // Upload to storage
      let url = "";
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const result = await vercelBlobStorage.upload(fileForStorage, file.name, {
          contentType: file.type,
          folder: `resumes/${auth.companyId}`,
        });
        url = result.url;
      } else {
        url = `local://${file.name}`;
      }

      // Extract basic details
      const fullName = aiParsedData?.name || "Unknown Candidate";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Candidate";
      
      const email = aiParsedData?.email || `candidate-${Date.now()}@unknown.com`;
      const phone = aiParsedData?.phone || null;
      const linkedinUrl = aiParsedData?.linkedin || null;

      // 1. Find or Create the Candidate
      let candidate = await prisma.candidate.findFirst({
        where: {
          email: email,
          companyId: auth.companyId
        }
      });

      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            linkedinUrl,
            company: { connect: { id: auth.companyId } },
          },
        });
      } else {
        // Update missing fields if the new resume provides them
        candidate = await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            phone: candidate.phone || phone,
            linkedinUrl: candidate.linkedinUrl || linkedinUrl,
            firstName: candidate.firstName === "Unknown" ? firstName : candidate.firstName,
            lastName: candidate.lastName === "Candidate" ? lastName : candidate.lastName,
          }
        });
      }

      // Ensure skills is strictly an array
      let safeSkills: string[] = [];
      if (Array.isArray(aiParsedData.skills)) {
        safeSkills = aiParsedData.skills.map((s: any) => String(s));
      } else if (typeof (aiParsedData.skills as any) === "string") {
        safeSkills = (aiParsedData.skills as any).split(",").map((s: string) => s.trim());
      }

      // 2. Create the Resume record attached to the candidate
      const resume = await prisma.resume.create({
        data: {
          candidate: { connect: { id: candidate.id } },
          fileUrl: url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          parsedContent: JSON.parse(JSON.stringify(aiParsedData)),
          skills: safeSkills,
        },
      });
      
      logger.info(
        { candidateId: candidate.id, resumeId: resume.id, fileName: file.name },
        "Candidate created automatically via resume parsing"
      );

      // NEW: 3. Auto-Apply to Job if applyToJobId is provided
      if (applyToJobId) {
        try {
          await applicationsService.create({ candidateId: candidate.id, jobId: applyToJobId }, auth.companyId);
          logger.info({ candidateId: candidate.id, jobId: applyToJobId }, "Auto-applied candidate to job");
        } catch (applyErr: any) {
          // If they already applied (409), that's fine, we still parsed the resume successfully.
          if (applyErr?.statusCode === 409 || applyErr?.code === 'DUPLICATE_APPLICATION') {
            logger.info({ candidateId: candidate.id, jobId: applyToJobId }, "Candidate already applied to job. Skipping auto-apply.");
          } else {
            logger.error({ err: applyErr, candidateId: candidate.id, jobId: applyToJobId }, "Failed to auto-apply candidate");
            // We do not throw the error here because the resume parsing itself was successful.
          }
        }
      }

      // 4. Complete Job
      await prisma.parsingJob.update({
        where: { id: parsingJob.id },
        data: { status: "COMPLETED", completedAt: new Date(), progress: 100 }
      });

      return createdResponse({
        candidate,
        resume
      });
    } catch (error: any) {
      logger.error({ err: error, fileName: file.name }, "Resume parsing failed");
      
      await prisma.parsingJob.update({
        where: { id: parsingJob.id },
        data: { 
          status: "FAILED", 
          error: error.message || "An unknown error occurred during parsing",
          completedAt: new Date()
        }
      });

      throw error;
    }
  }
);
