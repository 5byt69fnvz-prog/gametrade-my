import { NextRequest } from "next/server";
import { OtpChannel, OtpPurpose } from "@prisma/client";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { otpSendSchema } from "@/lib/validators";
import { sendOtp } from "@/lib/otp";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    const input = await parseJson(request, otpSendSchema);
    const limit = await consumeRateLimit(`otp-send:${user.id}:${input.channel}`, 8, 3600);
    if (!limit.allowed) throw new Error("RATE_LIMITED");
    const result = await sendOtp(user, OtpChannel[input.channel], OtpPurpose[input.purpose]);
    return jsonOk({ sent: true, channel: input.channel, demoCode: result.demoCode });
  } catch (error) {
    return apiError(error);
  }
}
