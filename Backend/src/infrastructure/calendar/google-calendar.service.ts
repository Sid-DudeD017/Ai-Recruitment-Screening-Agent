import { google, calendar_v3 } from "googleapis";
import { createClerkClient } from "@clerk/backend";
import { createModuleLogger } from "@/shared/utils/logger";
import { AppError } from "@/shared/errors";

const logger = createModuleLogger("google-calendar");

// Use the singleton client or create a new one using env variables
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const googleCalendarService = {
  /**
   * Initialize a Google Calendar API client using the user's Clerk OAuth token
   */
  async getClientForUser(clerkId: string) {
    try {
      // Fetch the Google OAuth token from Clerk for this user
      const response = await clerk.users.getUserOauthAccessToken(
        clerkId,
        "oauth_google"
      );

      const tokens = response.data;
      if (!tokens || tokens.length === 0) {
        logger.warn({ clerkId }, "No Google OAuth token found for user");
        return null; // User hasn't linked Google Calendar
      }

      const token = tokens[0].token;

      // Initialize OAuth2 client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: token });

      return google.calendar({ version: "v3", auth: oauth2Client });
    } catch (error) {
      logger.error({ error, clerkId }, "Failed to get Google Calendar client");
      return null;
    }
  },

  /**
   * Create an interview event on the user's Google Calendar
   */
  async createInterviewEvent(
    clerkId: string,
    data: {
      title: string;
      description: string;
      startTime: Date;
      durationMinutes: number;
      attendeeEmails: string[];
      isVirtual: boolean;
      location?: string;
    }
  ): Promise<{ eventId: string | null; meetingLink: string | null }> {
    const calendar = await this.getClientForUser(clerkId);
    if (!calendar) {
      return { eventId: null, meetingLink: null };
    }

    const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60000);

    const event: calendar_v3.Schema$Event = {
      summary: data.title,
      description: data.description,
      start: {
        dateTime: data.startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      attendees: data.attendeeEmails.map((email) => ({ email })),
    };

    if (data.isVirtual) {
      event.conferenceData = {
        createRequest: {
          requestId: `interview-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    } else if (data.location) {
      event.location = data.location;
    }

    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1, // Required to generate Google Meet link
        sendUpdates: "all", // Send email invites to attendees
      });

      logger.info(
        { eventId: response.data.id, clerkId },
        "Google Calendar event created successfully"
      );

      return {
        eventId: response.data.id || null,
        meetingLink: response.data.hangoutLink || null,
      };
    } catch (error) {
      logger.error({ error, clerkId }, "Failed to create Google Calendar event");
      return { eventId: null, meetingLink: null }; // Graceful degradation
    }
  },

  /**
   * Cancel an interview event
   */
  async cancelInterviewEvent(clerkId: string, eventId: string): Promise<void> {
    const calendar = await this.getClientForUser(clerkId);
    if (!calendar) return;

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
        sendUpdates: "all",
      });
      logger.info({ eventId, clerkId }, "Google Calendar event cancelled");
    } catch (error) {
      logger.error(
        { error, eventId, clerkId },
        "Failed to cancel Google Calendar event"
      );
    }
  },
};
