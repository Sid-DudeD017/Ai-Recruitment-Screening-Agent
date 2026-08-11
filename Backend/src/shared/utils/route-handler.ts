import { NextRequest, NextResponse } from "next/server";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "@/shared/errors/app-error";
import { ValidationError } from "@/shared/errors/validation.error";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error";
import { ForbiddenError } from "@/shared/errors/forbidden.error";
import { errorResponse } from "@/shared/utils/api-response";
import { createModuleLogger } from "@/shared/utils/logger";
import { prisma } from "@/infrastructure/database/prisma.client";

const logger = createModuleLogger("route-handler");

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Authenticated user context passed to route handlers
 */
export interface AuthContext {
  userId: string; // Our DB user ID
  clerkId: string; // Clerk user ID
  companyId: string; // Tenant ID
  role: string; // User role
}

/**
 * Handler function signature
 */
type RouteHandler<TBody = unknown> = (
  req: NextRequest,
  context: {
    auth: AuthContext;
    body: TBody;
    params: Record<string, string>;
  }
) => Promise<NextResponse>;

/**
 * Configuration for the route handler wrapper
 */
interface RouteHandlerConfig<TBody = unknown> {
  /** Zod schema for request body validation (for POST/PUT/PATCH) */
  bodySchema?: ZodSchema<TBody>;
  /** Allowed roles. If empty, any authenticated user can access. */
  allowedRoles?: string[];
  /** If true, the route is public (no auth required) */
  isPublic?: boolean;
}

/**
 * Composable route handler wrapper.
 * Handles auth, validation, error handling in one place.
 *
 * Usage:
 * ```ts
 * export const POST = routeHandler({
 *   bodySchema: createJobSchema,
 *   allowedRoles: ["ADMIN", "RECRUITER"],
 * }, async (req, { auth, body, params }) => {
 *   const job = await jobsService.create(body, auth.companyId);
 *   return createdResponse(job);
 * });
 * ```
 */
export function routeHandler<TBody = unknown>(
  config: RouteHandlerConfig<TBody>,
  handler: RouteHandler<TBody>
) {
  return async (
    req: NextRequest,
    segmentData?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // 1. Authentication
      let authContext: AuthContext | null = null;

      if (!config.isPublic) {
        authContext = await resolveAuth();

        // 2. Role-based access control
        if (config.allowedRoles && config.allowedRoles.length > 0) {
          if (!config.allowedRoles.includes(authContext.role)) {
            throw new ForbiddenError();
          }
        }
      }

      // 3. Body validation (for methods with body)
      let body: TBody = undefined as TBody;
      if (config.bodySchema) {
        const rawBody = await req.json().catch(() => ({}));
        const result = config.bodySchema.safeParse(rawBody);
        if (!result.success) {
          throw new ValidationError(result.error);
        }
        body = result.data;
      }

      // 4. Resolve dynamic route params
      const params = segmentData?.params ? await segmentData.params : {};

      // 5. Execute handler
      return await handler(req, {
        auth: authContext as AuthContext,
        body,
        params,
      });
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Public route handler — no auth required
 */
export function publicRouteHandler<TBody = unknown>(
  config: Omit<RouteHandlerConfig<TBody>, "isPublic">,
  handler: (
    req: NextRequest,
    context: { body: TBody; params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return routeHandler<TBody>(
    { ...config, isPublic: true },
    async (req, ctx) => handler(req, { body: ctx.body, params: ctx.params })
  );
}

/**
 * Resolve authenticated user from Clerk and map to our DB user
 */
async function resolveAuth(): Promise<AuthContext> {
  const { userId: clerkId, orgId, orgRole } = await auth();

  if (!clerkId) {
    throw new UnauthorizedError();
  }

  // Look up the user in our DB by Clerk ID
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true, companyId: true, role: true },
  });

  // JIT User Creation: If user isn't in DB, sync from Clerk API
  if (!user) {
    logger.info({ clerkId }, "JIT: User not found in local DB. Syncing from Clerk...");
    
    try {
      const clerkUser = await clerk.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) throw new UnauthorizedError("User has no email in Clerk");
      
      let companyIdToAssign = null;
      
      if (orgId) {
        // Sync the organization JIT
        const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
        const company = await prisma.company.upsert({
          where: { id: orgId },
          update: { name: clerkOrg.name },
          create: { id: orgId, name: clerkOrg.name }
        });
        companyIdToAssign = company.id;
        logger.info({ orgId }, "JIT: Synced Company from Clerk");
      } else {
        // Create a dummy company for local development if no org is selected
        const dummy = await prisma.company.upsert({
          where: { domain: "local.dev" },
          update: {},
          create: { name: "CodeLords Local Dev", domain: "local.dev" }
        });
        companyIdToAssign = dummy.id;
      }

      user = await prisma.user.upsert({
        where: { clerkId },
        update: {
          companyId: companyIdToAssign,
        },
        create: {
          clerkId,
          email,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          role: orgRole === "org:admin" ? "ADMIN" : "RECRUITER",
          companyId: companyIdToAssign,
        },
        select: { id: true, clerkId: true, companyId: true, role: true },
      });
      logger.info({ clerkId, userId: user.id }, "JIT: User synced successfully");
    } catch (error) {
      logger.error({ error, clerkId }, "JIT: Failed to sync user from Clerk");
      throw new UnauthorizedError("Failed to sync user. Please try again.");
    }
  }

  // JIT Context Switch: If they switched orgs in Clerk UI, update their active local context
  if (orgId && user.companyId !== orgId) {
    const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
    await prisma.company.upsert({
      where: { id: orgId },
      update: { name: clerkOrg.name },
      create: { id: orgId, name: clerkOrg.name }
    });
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        companyId: orgId,
        role: orgRole === "org:admin" ? "ADMIN" : "RECRUITER", 
      },
      select: { id: true, clerkId: true, companyId: true, role: true }
    });
    logger.info({ clerkId, newOrgId: orgId }, "JIT: User switched organization context");
  }

  if (!user.companyId) {
    throw new ForbiddenError("User is not associated with any company.");
  }

  return {
    userId: user.id,
    clerkId: user.clerkId,
    companyId: user.companyId,
    role: user.role,
  };
}

/**
 * Centralized error handler — maps errors to proper HTTP responses
 */
function handleError(error: unknown): NextResponse {
  // Known operational errors
  if (error instanceof ValidationError) {
    logger.warn({ code: error.code, errors: error.errors }, error.message);
    return errorResponse(error.message, error.statusCode, error.code, error.errors);
  }

  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn({ code: error.code }, error.message);
    } else {
      logger.error({ code: error.code, stack: error.stack }, error.message);
    }
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Zod errors that somehow weren't caught
  if (error instanceof ZodError) {
    const validationError = new ValidationError(error);
    return errorResponse(
      validationError.message,
      400,
      "VALIDATION_ERROR",
      validationError.errors
    );
  }

  // Unknown / programming errors
  logger.error(
    { err: error instanceof Error ? error.stack : error },
    "Unhandled error in route handler"
  );
  return errorResponse(
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : (error as Error)?.message || "Unknown error",
    500,
    "INTERNAL_ERROR"
  );
}
