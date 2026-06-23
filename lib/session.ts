import "server-only";
import { cookies, headers } from "next/headers";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { createSessionToken, hashNetworkValue, hashOpaqueToken } from "@/lib/security";

const COOKIE_NAME = "gametrade_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = createSessionToken();
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(token),
      expiresAt,
      userAgent: headerStore.get("user-agent")?.slice(0, 500),
      ipHash: hashNetworkValue(headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")
    }
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await db.session.updateMany({ where: { tokenHash: hashOpaqueToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  cookieStore.delete(COOKIE_NAME);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findFirst({
    where: { tokenHash: hashOpaqueToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { include: { sellerProfile: true } } }
  });
  if (!session || session.user.banned) return null;
  return session.user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerified) throw new Error("VERIFICATION_REQUIRED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("FORBIDDEN");
  return user;
}
