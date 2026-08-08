import { Prisma } from "@/generated/prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/client";

/**
 * Helper to convert a nullable JSON value to Prisma-compatible input.
 * Prisma 7 requires `Prisma.JsonNull` instead of plain `null` for JSON fields.
 */
export function toJsonInput(
  value: Record<string, unknown> | unknown[] | string | number | boolean | null | undefined
): Prisma.NullableJsonNullValueInput | InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as InputJsonValue;
}
