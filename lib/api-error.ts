import { Prisma } from "@prisma/client";
import { jsonError, zodErrorResponse } from "@/lib/http";

export function apiError(error: unknown) {
  const validation = zodErrorResponse(error);
  if (validation) return validation;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return jsonError("Email or phone is already registered", 409);
  const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const mapped: Record<string, [string, number]> = {
    UNTRUSTED_ORIGIN: ["Untrusted request origin", 403],
    UNAUTHENTICATED: ["Authentication required", 401],
    FORBIDDEN: ["Permission denied", 403],
    VERIFICATION_REQUIRED: ["Verify Email or SMS before trading", 403],
    OTP_COOLDOWN: ["Please wait before requesting another OTP", 429],
    OTP_INVALID: ["OTP is invalid, expired, or has too many attempts", 422],
    RATE_LIMITED: ["Too many requests. Try again later", 429],
    INVALID_CREDENTIALS: ["Invalid login credentials", 401],
    ACCOUNT_BANNED: ["Account is banned", 403],
    NOT_FOUND: ["Resource not found", 404],
    VALIDATION_ERROR: ["Please check the submitted information", 422],
    INVALID_STATE: ["Action is not allowed in the current state", 409],
    INSUFFICIENT_BALANCE: ["Insufficient wallet balance", 409],
    UNSUPPORTED_FILE_TYPE: ["Unsupported upload type", 415],
    STORAGE_NOT_CONFIGURED: ["Image storage is not configured", 503]
  };
  if (mapped[message]) return jsonError(mapped[message][0], mapped[message][1]);
  console.error(error);
  return jsonError("Internal server error", 500);
}
