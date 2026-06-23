import { NextRequest } from "next/server";
import { OtpChannel, OtpPurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson, requestIp } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { hashNetworkValue, hashPassword, normalizeEmail, normalizeMalaysianPhone } from "@/lib/security";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { sendOtp } from "@/lib/otp";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const input = await parseJson(request, registerSchema);
    const emailNormalized = normalizeEmail(input.email);
    const phoneNormalized = input.phone ? normalizeMalaysianPhone(input.phone) : null;
    if (phoneNormalized && !/^\+60\d{8,10}$/.test(phoneNormalized)) throw new Error("VALIDATION_PHONE");
    const limit = await consumeRateLimit(`register:${hashNetworkValue(requestIp(request))}`, 5, 3600);
    if (!limit.allowed) throw new Error("RATE_LIMITED");
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email.trim(),
        emailNormalized,
        phone: input.phone?.trim() || null,
        phoneNormalized,
        passwordHash: await hashPassword(input.password)
      }
    });
    await createSession(user.id);
    const delivery = await Promise.allSettled([sendOtp(user, OtpChannel.EMAIL, OtpPurpose.REGISTRATION)]);
    await audit({ actorId: user.id, action: "USER_REGISTERED", entityType: "User", entityId: user.id, ipHash: hashNetworkValue(requestIp(request)) });
    return jsonOk({
      user: { id: user.id, name: user.name, emailVerified: false, phoneVerified: false },
      delivery: {
        email: delivery[0].status,
        demoCode: delivery[0].status === "fulfilled" ? delivery[0].value.demoCode : undefined
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "VALIDATION_PHONE") return Response.json({ ok: false, error: "Use a valid Malaysian phone number" }, { status: 422 });
    return apiError(error);
  }
}
