import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: PaginationMeta
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

/**
 * Standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code: string = "INTERNAL_ERROR",
  errors?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(errors && { errors }) },
    },
    { status }
  );
}

/**
 * Standardized created response (201)
 */
export function createdResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201);
}

/**
 * Standardized no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
