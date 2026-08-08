import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/infrastructure/database/prisma.client";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("clerk-webhook");

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events to sync users to our database.
 *
 * Events handled:
 * - user.created → Create User record
 * - user.updated → Update User record
 * - user.deleted → Soft-delete User record
 */
export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the Svix headers for verification
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn("Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook verification headers" },
      { status: 400 }
    );
  }

  // Get the body
  const body = await req.text();

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    logger.warn({ err }, "Webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle the event
  const eventType = event.type;
  logger.info({ eventType }, "Processing Clerk webhook event");

  try {
    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url } =
          event.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          logger.warn({ clerkId: id }, "User created without email");
          break;
        }

        await prisma.user.create({
          data: {
            clerkId: id,
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
            avatarUrl: image_url || null,
            role: "RECRUITER", // Default role — can be changed later
          },
        });

        logger.info({ clerkId: id, email: primaryEmail }, "User created");
        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } =
          event.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail || undefined,
            firstName: first_name || null,
            lastName: last_name || null,
            avatarUrl: image_url || null,
          },
        });

        logger.info({ clerkId: id }, "User updated");
        break;
      }

      case "user.deleted": {
        const { id } = event.data;

        if (id) {
          await prisma.user.update({
            where: { clerkId: id },
            data: { isActive: false },
          });

          logger.info({ clerkId: id }, "User soft-deleted");
        }
        break;
      }

      default:
        logger.debug({ eventType }, "Unhandled webhook event type");
    }
  } catch (error) {
    logger.error({ eventType, error }, "Failed to process webhook event");
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
