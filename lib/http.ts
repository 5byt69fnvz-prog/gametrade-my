import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export async function parseJson<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  return schema.parse(await request.json());
}

export function zodErrorResponse(error: unknown) {
  if (error instanceof ZodError) return jsonError("Validation failed", 422, error.flatten());
  return null;
}

export function assertTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const configured = process.env.APP_URL;
  if (!origin) return;
  if (configured && origin === new URL(configured).origin) return;
  if (process.env.NODE_ENV !== "production" && origin === request.nextUrl.origin) return;
  throw new Error("UNTRUSTED_ORIGIN");
}

export function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
