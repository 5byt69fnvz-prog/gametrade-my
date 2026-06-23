import "server-only";
import { DeliveryStatus, OtpChannel, OtpPurpose, type User } from "@prisma/client";
import { db } from "@/lib/db";
import { generateOtp, hashOtp, safeHashEqual } from "@/lib/security";

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

async function sendEmailOtp(destination: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email provider is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [destination],
      subject: "GameTrade MY verification code",
      html: `<p>Your GameTrade MY verification code is:</p><p style="font-size:32px;font-weight:700">${code}</p><p>This code expires in 10 minutes.</p>`
    })
  });
  if (!response.ok) throw new Error(`Email provider rejected request (${response.status})`);
  const data = (await response.json()) as { id?: string };
  return data.id;
}

export async function sendOtp(user: User, channel: OtpChannel, purpose: OtpPurpose) {
  if (channel !== OtpChannel.EMAIL) throw new Error("OTP_CHANNEL_DISABLED");
  const recent = await db.otpChallenge.findFirst({
    where: { userId: user.id, channel, purpose },
    orderBy: { createdAt: "desc" }
  });
  if (recent && recent.resendAvailableAt > new Date()) throw new Error("OTP_COOLDOWN");
  const code = generateOtp();
  const destination = user.emailNormalized;
  const challenge = await db.otpChallenge.create({
    data: {
      userId: user.id,
      channel,
      purpose,
      destination,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + TEN_MINUTES),
      resendAvailableAt: new Date(Date.now() + ONE_MINUTE)
    }
  });
  try {
    const providerMessageId = await sendEmailOtp(destination, code);
    await db.otpChallenge.update({ where: { id: challenge.id }, data: { deliveryStatus: DeliveryStatus.SENT, providerMessageId } });
  } catch (error) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { deliveryStatus: DeliveryStatus.FAILED, failureReason: error instanceof Error ? error.message.slice(0, 500) : "Unknown provider error" }
    });
    throw error;
  }
  return challenge.id;
}

export async function verifyOtp(userId: string, channel: OtpChannel, purpose: OtpPurpose, code: string) {
  return db.$transaction(async (tx) => {
    const challenge = await tx.otpChallenge.findFirst({
      where: { userId, channel, purpose, verifiedAt: null, expiresAt: { gt: new Date() }, deliveryStatus: DeliveryStatus.SENT },
      orderBy: { createdAt: "desc" }
    });
    if (!challenge || challenge.attempts >= challenge.maxAttempts) throw new Error("OTP_INVALID");
    if (!safeHashEqual(challenge.codeHash, hashOtp(code))) {
      await tx.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      throw new Error("OTP_INVALID");
    }
    await tx.otpChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } });
    await tx.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        primaryVerification: OtpChannel.EMAIL
      }
    });
    return true;
  });
}
