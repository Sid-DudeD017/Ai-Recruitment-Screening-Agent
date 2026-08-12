import { NextRequest } from "next/server";
import { routeHandler } from "@/shared/utils/route-handler";
import { createdResponse } from "@/shared/utils/api-response";
import { prisma } from "@/infrastructure/database/prisma.client";
import { vercelBlobStorage } from "@/infrastructure/storage/vercel-blob.storage";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { AppError } from "@/shared/errors";
import { APP_CONSTANTS } from "@/config";
import { createModuleLogger } from "@/shared/utils/logger";

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

    // Upload to storage
    let url = "";
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const result = await vercelBlobStorage.upload(file, file.name, {
        contentType: file.type,
        folder: `resumes/${auth.companyId}`,
      });
      url = result.url;
    } else {
      url = `local://${file.name}`;
    }

    let aiParsedData: any = {};
    
    // Parse the resume using the Python AI agent
    try {
      logger.info({ fileName: file.name }, "Sending PDF to AI agent for parsing");
      aiParsedData = await aiClient.uploadAndParseResume(file);
    } catch (error) {
      logger.error("Failed to parse resume with AI Agent. Proceeding with blank candidate.", error);
      // We gracefully degrade instead of failing the entire upload.
      aiParsedData = {
        name: file.name.replace(/\.[^/.]+$/, ""), // Use filename as fallback name
        skills: []
      };
    }

    // Extract basic details (fallback if missing)
    const fullName = aiParsedData?.name || "Unknown Candidate";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "Candidate";
    
    // Auto-generate a dummy email if AI couldn't find one, to satisfy DB constraints
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

    // Ensure skills is strictly an array to prevent Prisma crashing if AI hallucinated a string
    let safeSkills: string[] = [];
    if (Array.isArray(aiParsedData.skills)) {
      safeSkills = aiParsedData.skills.map((s: any) => String(s));
    } else if (typeof aiParsedData.skills === "string") {
      safeSkills = aiParsedData.skills.split(",").map((s: string) => s.trim());
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

    return createdResponse({
      candidate,
      resume
    });
  }
);
