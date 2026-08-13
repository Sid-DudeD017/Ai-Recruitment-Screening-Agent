import { NextRequest } from "next/server";
import { routeHandler } from "@/shared/utils/route-handler";
import { createdResponse } from "@/shared/utils/api-response";
import { prisma } from "@/infrastructure/database/prisma.client";
import { vercelBlobStorage } from "@/infrastructure/storage/vercel-blob.storage";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { candidatesRepository } from "@/modules/candidates/candidates.repository";
import { NotFoundError, AppError } from "@/shared/errors";
import { APP_CONSTANTS } from "@/config";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("resume-upload");

/**
 * POST /api/candidates/:id/resume
 * Upload a resume file for a candidate
 */
export const POST = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER"] },
  async (req: NextRequest, { auth, params }) => {
    // Verify candidate exists and belongs to company
    const candidate = await candidatesRepository.findById(
      params.id,
      auth.companyId
    );
    if (!candidate) {
      throw new NotFoundError("Candidate", params.id);
    }

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

    // Validate file size
    if (file.size > APP_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        `File size exceeds maximum of ${APP_CONSTANTS.MAX_FILE_SIZE_MB}MB`,
        400,
        "FILE_TOO_LARGE"
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
      logger.warn("BLOB_READ_WRITE_TOKEN not found, skipping Vercel Blob upload");
      url = `local://${file.name}`;
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        candidate: { connect: { id: params.id } },
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
    
    // Parse the resume using the Python AI agent
    try {
      const aiParsedData = await aiClient.uploadAndParseResume(file);
      
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          parsedContent: JSON.parse(JSON.stringify(aiParsedData)),
          skills: aiParsedData.skills || []
        }
      });
      
      // Also update candidate with skills from resume if they don't have it
      // For simplicity, we just attach it to the resume right now.
      
    } catch (error) {
      logger.error({ err: error }, "Failed to parse resume with AI Agent");
      // We don't fail the whole request if AI parsing fails, as the file was uploaded successfully.
    }

    logger.info(
      { resumeId: resume.id, candidateId: params.id, fileName: file.name },
      "Resume uploaded"
    );

    return createdResponse(resume);
  }
);
