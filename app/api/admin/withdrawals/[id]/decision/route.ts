import { NextRequest } from "next/server";
import { LedgerType, WithdrawalStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { adminDecisionSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { serialize } from "@/lib/serializers";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const admin = await requireAdmin();
    const { id } = await context.params;
    const input = await parseJson(request, adminDecisionSchema);
    const withdrawal = await db.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new Error("NOT_FOUND");
    if (withdrawal.status !== WithdrawalStatus.PENDING) throw new Error("INVALID_STATE");
    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.withdrawal.updateMany({
        where: { id, status: WithdrawalStatus.PENDING },
        data: { status: input.decision === "APPROVE" ? WithdrawalStatus.PAID : WithdrawalStatus.REJECTED, note: input.note, reviewedById: admin.id, reviewedAt: new Date(), paidAt: input.decision === "APPROVE" ? new Date() : null }
      });
      if (changed.count !== 1) throw new Error("INVALID_STATE");
      if (input.decision === "REJECT") await tx.walletLedger.create({ data: { userId: withdrawal.userId, type: LedgerType.RELEASE, amount: withdrawal.amount, note: `Withdrawal rejected ${id}` } });
      return tx.withdrawal.findUniqueOrThrow({ where: { id } });
    });
    await audit({ actorId: admin.id, action: `WITHDRAWAL_${input.decision}D`, entityType: "Withdrawal", entityId: id, metadata: { note: input.note } });
    return jsonOk(serialize(updated));
  } catch (error) {
    return apiError(error);
  }
}
