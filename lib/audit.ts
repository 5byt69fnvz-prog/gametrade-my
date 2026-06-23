import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function audit(input: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipHash?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({ data: input as Prisma.AuditLogUncheckedCreateInput });
}
