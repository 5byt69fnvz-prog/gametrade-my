import { NextRequest } from "next/server";
import { OrderStatus, PaymentProofStatus } from "@prisma/client";
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
    const proof = await db.paymentProof.findUnique({ where: { id }, include: { order: true } });
    if (!proof) throw new Error("NOT_FOUND");
    if (proof.status !== PaymentProofStatus.PENDING || proof.order.status !== OrderStatus.PAYMENT_REVIEW) throw new Error("INVALID_STATE");
    const updated = await db.$transaction(async (tx) => {
      const changedOrder = await tx.order.updateMany({
        where: { id: proof.orderId, status: OrderStatus.PAYMENT_REVIEW },
        data: input.decision === "APPROVE"
          ? { status: OrderStatus.AWAITING_DELIVERY, paymentApprovedAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
          : { status: OrderStatus.PAYMENT_REJECTED }
      });
      if (changedOrder.count !== 1) throw new Error("INVALID_STATE");
      const changedProof = await tx.paymentProof.updateMany({
        where: { id, status: PaymentProofStatus.PENDING },
        data: { status: input.decision === "APPROVE" ? PaymentProofStatus.APPROVED : PaymentProofStatus.REJECTED, note: input.note, reviewedById: admin.id, reviewedAt: new Date() }
      });
      if (changedProof.count !== 1) throw new Error("INVALID_STATE");
      return tx.paymentProof.findUniqueOrThrow({ where: { id } });
    });
    await audit({ actorId: admin.id, action: `PAYMENT_${input.decision}D`, entityType: "PaymentProof", entityId: id, metadata: { orderId: proof.orderId, note: input.note } });
    return jsonOk(serialize(updated));
  } catch (error) {
    return apiError(error);
  }
}
