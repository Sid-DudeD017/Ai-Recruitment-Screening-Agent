import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { z } from "zod";
import { applicationsService } from "@/modules/applications/applications.service";
import { prisma } from "@/infrastructure/database/prisma.client";
import { normalizeStatus } from "./status-mapper";

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  })),
  currentUrl: z.string().optional()
});

export const POST = routeHandler(
  {
    bodySchema: chatSchema,
    allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"],
  },
  async (req, { auth, body }) => {
    const aiAction: any = await aiClient.chat(body);

    let reply = "";
    let pendingAction: any = null;

    switch (aiAction.action_type) {
      case "RESPOND":
        reply = aiAction.response_text || "I'm sorry, I didn't understand that.";
        break;

      case "FETCH_CANDIDATES": {
        const { role } = aiAction.tool_args || {};
        
        let jobIds: string[] = [];
        if (role) {
          const jobs = await prisma.job.findMany({ 
            where: { companyId: auth.companyId, title: { contains: role, mode: 'insensitive' } } 
          });
          jobIds = jobs.map(j => j.id);
        }

        const whereClause: any = { job: { companyId: auth.companyId } };
        if (jobIds.length > 0) {
          whereClause.jobId = { in: jobIds };
        }

        const candidates = await prisma.application.findMany({
          where: whereClause,
          take: 5,
          orderBy: { matchScore: 'desc' },
          include: { candidate: true, job: true }
        });
        
        if (candidates.length === 0) {
          reply = `I couldn't find any candidates for the role: ${role || 'any role'}.`;
        } else {
          reply = `Here are the top candidates I found:\n` + candidates.map((c: any) => 
            `- **${c.candidate.firstName} ${c.candidate.lastName}** (${c.job.title}) - Score: ${c.matchScore}/100 [Status: ${c.status}]`
          ).join("\n");
        }
        break;
      }

      case "SEND_BULK_EMAILS": {
        const { role, email_type } = aiAction.tool_args || {};
        if (!role || !email_type) {
          reply = "I need to know which role and what type of email you want to send.";
          break;
        }
        reply = `Are you sure you want to send ${email_type} emails to all ${role} candidates?`;
        pendingAction = {
          tool: "SEND_BULK_EMAILS",
          args: aiAction.tool_args
        };
        break;
      }

      case "UPDATE_STATUS": {
        const { candidate_name } = aiAction.tool_args || {};
        const new_status = normalizeStatus(String(aiAction.tool_args?.new_status || ""));
        if (!candidate_name || !new_status) {
          reply = "I couldn't understand which candidate or what status you meant.";
          break;
        }
        reply = `Are you sure you want to move ${candidate_name} to the ${new_status} stage?`;
        pendingAction = {
          tool: "UPDATE_STATUS",
          args: aiAction.tool_args
        };
        break;
      }

      case "BULK_UPDATE_STATUS": {
        const { role } = aiAction.tool_args || {};
        const current_status = normalizeStatus(String(aiAction.tool_args?.current_status || ""));
        const new_status = normalizeStatus(String(aiAction.tool_args?.new_status || ""));
        
        if (!role || !current_status || !new_status) {
          reply = "I need to know the role, the current status, and the new status to perform a bulk move.";
          break;
        }
        reply = `Are you sure you want to move ALL **${role}** candidates from **${current_status}** to **${new_status}**?`;
        pendingAction = {
          tool: "BULK_UPDATE_STATUS",
          args: aiAction.tool_args
        };
        break;
      }

      default:
        reply = "I am not sure how to handle that request.";
        break;
    }

    return successResponse({ reply, pendingAction });
  }
);
