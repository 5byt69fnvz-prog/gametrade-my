import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson, requestIp } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { hashNetworkValue, hashPassword, normalizeEmail, normalizeMalaysianPhone, verifyPassword } from "@/lib/security";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { audit } from "@/lib/audit";

async function restoreInitialAdmin(loginId: string, password: string) {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return null;
  const emailNormalized = normalizeEmail(adminEmail);
  if (normalizeEmail(loginId) !== emailNormalized || password !== adminPassword) return null;
  const phone = process.env.INITIAL_ADMIN_PHONE || null;
  return db.user.upsert({
    where: { emailNormalized },
    create: {
      role: UserRole.ADMIN,
      name: process.env.INITIAL_ADMIN_NAME || "GameTrade Admin",
      email: adminEmail,
      emailNormalized,
      phone,
      phoneNormalized: phone ? normalizeMalaysianPhone(phone) : null,
      passwordHash: await hashPassword(adminPassword),
      emailVerified: true,
      phoneVerified: false,
      primaryVerification: "EMAIL"
    },
    update: {
      role: UserRole.ADMIN,
      name: process.env.INITIAL_ADMIN_NAME || "GameTrade Admin",
      email: adminEmail,
      phone,
      phoneNormalized: phone ? normalizeMalaysianPhone(phone) : null,
      passwordHash: await hashPassword(adminPassword),
      emailVerified: true,
      banned: false,
      primaryVerification: "EMAIL"
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const input = await parseJson(request, loginSchema);
    const ipHash = hashNetworkValue(requestIp(request));
    const limit = await consumeRateLimit(`login:${ipHash}`, 10, 900);
    if (!limit.allowed) throw new Error("RATE_LIMITED");
    const isEmail = input.loginId.includes("@");
    const normalized = isEmail ? normalizeEmail(input.loginId) : normalizeMalaysianPhone(input.loginId);
    const accountLimit = await consumeRateLimit(`login-account:${hashNetworkValue(normalized)}`, 20, 3600);
    if (!accountLimit.allowed) throw new Error("RATE_LIMITED");
    let user = await db.user.findFirst({ where: isEmail ? { emailNormalized: normalized } : { phoneNormalized: normalized } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      user = isEmail ? await restoreInitialAdmin(input.loginId, input.password) : null;
      if (!user) {
        await audit({ action: "LOGIN_FAILED", entityType: "User", ipHash, metadata: { loginType: isEmail ? "email" : "phone" } });
        throw new Error("INVALID_CREDENTIALS");
      }
    }
    if (user.banned) throw new Error("ACCOUNT_BANNED");
    await createSession(user.id);
    await audit({ actorId: user.id, action: "LOGIN_SUCCEEDED", entityType: "User", entityId: user.id, ipHash });
    return jsonOk({ user: { id: user.id, name: user.name, role: user.role, emailVerified: user.emailVerified, phoneVerified: user.phoneVerified } });
  } catch (error) {
    return apiError(error);
  }
}
