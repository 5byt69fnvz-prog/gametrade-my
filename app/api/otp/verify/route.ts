import { NextRequest } from "next/server";
import { OtpChannel, OtpPurpose } from "@prisma/client";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { otpVerifySchema } from "@/lib/validators";
import { verifyOtp } from "@/lib/otp";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    const input = await parseJson(request, otpVerifySchema);
    await verifyOtp(user.id, OtpChannel[input.channel], OtpPurpose[input.purpose], input.code);
    await audit({ actorId: user.id, action: "OTP_VERIFIED", entityType: "User", entityId: user.id, metadata: { channel: input.channel, purpose: input.purpose } });
    return jsonOk({ verified: true, channel: input.channel });
  } catch (error) {
    return apiError(error);
  }
}
