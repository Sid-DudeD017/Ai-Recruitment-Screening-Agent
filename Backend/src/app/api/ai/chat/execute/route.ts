import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { z } from "zod";
import { applicationsService } from "@/modules/applications/applications.service";
import { prisma } from "@/infrastructure/database/prisma.client";
import { normalizeStatus } from "../status-mapper";

const executeSchema = z.object({
  tool: z.enum(["SEND_BULK_EMAILS", "UPDATE_STATUS", "BULK_UPDATE_STATUS"]),
  args: z.record(z.string(), z.any())
});

export const POST = routeHandler(
  {
    bodySchema: executeSchema,
    allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"],
  },
  async (req, { auth, body }) => {
    let reply = "";

    switch (body.tool) {
      case "SEND_BULK_EMAILS": {
        const role = String(body.args.role || "");
        const email_type = String(body.args.email_type || "");
        
        let jobIds: string[] = [];
        if (role) {
          const jobs = await prisma.job.findMany({ 
            where: { companyId: auth.companyId, title: { contains: role, mode: 'insensitive' } } 
          });
          jobIds = jobs.map(j => j.id);
        }

        const targetStatus = email_type === 'interview_invite' ? 'INTERVIEW' : email_type === 'rejection' ? 'REJECTED' : undefined;

        const candidates = await prisma.application.findMany({
          where: { 
            jobId: { in: jobIds },
            ...(targetStatus ? { status: targetStatus } : {}),
            emailDraft: null
          },
          include: { candidate: true, job: true }
        });

        if (candidates.length === 0) {
          reply = `I couldn't find any candidates for ${role} that need a ${email_type} email.`;
          break;
        }

        reply = `✅ Successfully queued ${candidates.length} ${email_type} emails for the ${role} candidates.`;
        break;
      }

      case "UPDATE_STATUS": {
        const candidate_name = String(body.args.candidate_name || "");
        const new_status = String(body.args.new_status || "");
        
        const upperStatus = normalizeStatus(new_status);
        
        const candidates = await prisma.application.findMany({
          where: {
            job: { companyId: auth.companyId },
            candidate: { firstName: { contains: candidate_name.split(" ")[0], mode: 'insensitive' } },
            status: { not: upperStatus as any }
          },
          take: 1,
          include: { candidate: true }
        });

        if (candidates.length === 0) {
          reply = `I couldn't find any candidate named ${candidate_name} that needs moving.`;
          break;
        }

        const app: any = candidates[0];
        try {
          await applicationsService._transition(app.id, upperStatus, auth.companyId);
          reply = `✅ Successfully moved **${app.candidate.firstName} ${app.candidate.lastName}** to **${upperStatus}** status.`;
        } catch (e: any) {
          reply = `Failed to update status: ${e.message}`;
        }
        break;
      }

      case "BULK_UPDATE_STATUS": {
        const role = String(body.args.role || "");
        const current_status = normalizeStatus(String(body.args.current_status || ""));
        const new_status = normalizeStatus(String(body.args.new_status || ""));
        
        let jobIds: string[] = [];
        if (role) {
          const jobs = await prisma.job.findMany({ 
            where: { companyId: auth.companyId, title: { contains: role, mode: 'insensitive' } } 
          });
          jobIds = jobs.map(j => j.id);
        }

        const candidates = await prisma.application.findMany({
          where: {
            jobId: { in: jobIds },
            status: current_status as any
          }
        });

        if (candidates.length === 0) {
          reply = `I couldn't find any ${role} candidates currently in the ${current_status} stage.`;
          break;
        }

        let successCount = 0;
        for (const app of candidates) {
          try {
            await applicationsService._transition(app.id, new_status, auth.companyId);
            successCount++;
          } catch (e: any) {
            console.error(`Failed to move ${app.id}: ${e.message}`);
          }
        }
        
        reply = `✅ Successfully moved **${successCount}** candidates for **${role}** from **${current_status}** to **${new_status}** status.`;
        break;
      }
    }

    return successResponse({ reply });
  }
);
