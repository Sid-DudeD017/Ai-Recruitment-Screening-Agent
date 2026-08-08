import { createClerkClient } from "@clerk/nextjs/server";

/**
 * Clerk backend client for server-side operations.
 * Used for user management, webhook verification, etc.
 */
export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
