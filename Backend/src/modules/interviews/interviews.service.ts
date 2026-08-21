import { interviewsRepository } from "./interviews.repository";
import { toInterviewDto } from "./interviews.types";
import type {
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewFilterInput,
} from "./interviews.validator";
import { NotFoundError, AppError } from "@/shared/errors";
import { buildPaginatedResult } from "@/shared/utils/pagination";
import { applicationsRepository } from "@/modules/applications/applications.repository";
import { jitsiService } from "@/infrastructure/calendar/jitsi.service";
import { prisma } from "@/infrastructure/database/prisma.client";
import { createModuleLogger } from "@/shared/utils/logger";
import { nodemailerEmailService } from "@/infrastructure/email/nodemailer.adapter";

const logger = createModuleLogger("interviews-service");

// ============================================================================
// Interviews Service
// ============================================================================

export const interviewsService = {
  /**
   * Schedule a new interview
   */
  async create(input: CreateInterviewInput, companyId: string, clerkId: string) {
    // Verify the application exists and belongs to the company
    const application = await applicationsRepository.findById(
      input.applicationId,
      companyId
    );
    if (!application) {
      throw new NotFoundError("Application", input.applicationId);
    }

    // Verify application is in a valid state for scheduling
    const validStatuses = ["SHORTLISTED", "INTERVIEW"];
    if (!validStatuses.includes(application.status)) {
      throw new AppError(
        `Cannot schedule interview for application with status '${application.status}'. Must be SHORTLISTED or INTERVIEW.`,
        400,
        "INVALID_APPLICATION_STATUS"
      );
    }

    // Generate Jitsi meeting link if virtual BEFORE creating the interview
    let meetingLink = input.meetingLink || null;
    if (input.type === "VIDEO" && !meetingLink) {
      const candidateName = `${application.candidate.firstName}${application.candidate.lastName}`;
      meetingLink = jitsiService.generateMeetingLink(candidateName, application.job.title);
    }

    const interview = await interviewsRepository.create({
      application: { connect: { id: input.applicationId } },
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      type: input.type,
      location: input.location,
      meetingLink: meetingLink,
      interviewerIds: input.interviewerIds,
      notes: input.notes,
    });

    // If application is SHORTLISTED, move it to INTERVIEW
    if (application.status === "SHORTLISTED") {
      await applicationsRepository.updateStatus(
        input.applicationId,
        "INTERVIEW"
      );
    }

    // Send email to the candidate
    if (meetingLink) {
      const emailBody = `
        <p>Dear ${application.candidate.firstName},</p>
        <p>Your interview for the <strong>${application.job.title}</strong> position has been scheduled.</p>
        <p><strong>Date & Time:</strong> ${new Date(input.scheduledAt).toLocaleString()}</p>
        <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
        <p>Looking forward to speaking with you!</p>
      `;
      
      try {
        await nodemailerEmailService.send({
          to: application.candidate.email,
          subject: `Interview Scheduled: ${application.job.title}`,
          html: emailBody
        });
        logger.info({ email: application.candidate.email }, "Interview email sent");
      } catch (err) {
        logger.error({ err }, "Failed to send interview email");
      }
    }

    logger.info(
      { interviewId: interview.id, applicationId: input.applicationId },
      "Interview scheduled"
    );

    return interview;
  },

  /**
   * Schedule interviews in batch for a role/group of applications
   */
  async createBatch(
    input: {
      applicationIds: string[];
      baseScheduledAt: Date;
      staggerMinutes: number;
      durationMinutes: number;
      type: "PHONE" | "VIDEO" | "ONSITE" | "TECHNICAL";
      interviewerIds: string[];
      location?: string;
      meetingLink?: string;
      notes?: string;
    },
    companyId: string,
    clerkId: string
  ) {
    const createdInterviews = [];
    const baseMs = new Date(input.baseScheduledAt).getTime();

    for (let i = 0; i < input.applicationIds.length; i++) {
      const appId = input.applicationIds[i];
      const scheduledTime = new Date(baseMs + i * input.staggerMinutes * 60 * 1000);

      const created = await this.create(
        {
          applicationId: appId,
          scheduledAt: scheduledTime,
          durationMinutes: input.durationMinutes,
          type: input.type,
          interviewerIds: input.interviewerIds,
          location: input.location,
          meetingLink: input.meetingLink,
          notes: input.notes,
        },
        companyId,
        clerkId
      );
      createdInterviews.push(created);
    }

    return createdInterviews;
  },

  async getById(id: string, companyId: string) {
    const interview = await interviewsRepository.findById(id, companyId);
    if (!interview) {
      throw new NotFoundError("Interview", id);
    }
    return interview;
  },

  async list(filters: InterviewFilterInput, companyId: string) {
    const { data, total } = await interviewsRepository.findMany({
      ...filters,
      companyId,
    });

    return buildPaginatedResult(data.map(toInterviewDto), total, {
      page: filters.page,
      limit: filters.limit,
    });
  },

  /**
   * Update/reschedule an interview
   */
  async update(
    id: string,
    input: UpdateInterviewInput,
    companyId: string
  ) {
    const existing = await interviewsRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Interview", id);
    }

    if (existing.status === "CANCELLED") {
      throw new AppError(
        "Cannot update a cancelled interview",
        400,
        "INTERVIEW_CANCELLED"
      );
    }

    const updated = await interviewsRepository.update(id, {
      ...input,
      meetingLink: input.meetingLink || undefined,
    });

    logger.info({ interviewId: id }, "Interview updated");
    return updated;
  },

  /**
   * Cancel an interview
   */
  async cancel(id: string, companyId: string, clerkId: string) {
    const existing = await interviewsRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Interview", id);
    }

    if (existing.status === "CANCELLED") {
      throw new AppError(
        "Interview is already cancelled",
        400,
        "ALREADY_CANCELLED"
      );
    }

    if (existing.status === "COMPLETED") {
      throw new AppError(
        "Cannot cancel a completed interview",
        400,
        "INTERVIEW_COMPLETED"
      );
    }

    await interviewsRepository.updateStatus(id, "CANCELLED");

    logger.info({ interviewId: id }, "Interview cancelled");
  },

  /**
   * Complete an interview with feedback
   */
  async complete(
    id: string,
    feedback: string,
    rating: number,
    companyId: string
  ) {
    const existing = await interviewsRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Interview", id);
    }

    if (existing.status !== "SCHEDULED") {
      throw new AppError(
        `Cannot complete interview with status '${existing.status}'`,
        400,
        "INVALID_INTERVIEW_STATUS"
      );
    }

    const updated = await interviewsRepository.update(id, {
      status: "COMPLETED",
      feedback,
      rating,
    });

    logger.info({ interviewId: id, rating }, "Interview completed");
    return updated;
  },
};
