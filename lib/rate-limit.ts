import "server-only";
import { db } from "@/lib/db";

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) }
      });
      return { allowed: true, remaining: limit - 1 };
    }
    if (existing.count >= limit) return { allowed: false, remaining: 0, retryAt: existing.resetAt };
    await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: limit - existing.count - 1 };
  });
}
