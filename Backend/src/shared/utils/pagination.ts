import { z } from "zod";
import { APP_CONSTANTS } from "@/config";

/**
 * Zod schema for pagination query params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(APP_CONSTANTS.MAX_PAGE_SIZE)
    .default(APP_CONSTANTS.DEFAULT_PAGE_SIZE),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Calculate skip/take for Prisma from page/limit params
 */
export function getPrismaOffset(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

/**
 * Build paginated result with meta
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrevious: params.page > 1,
    },
  };
}

/**
 * Extract pagination params from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  return paginationSchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
}
