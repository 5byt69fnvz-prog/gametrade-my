import { NextRequest } from "next/server";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { proofSchema } from "@/lib/validators";
import { serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const { id } = await context.params;
    const input = await parseJson(request, proofSchema);
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw new Error("NOT_FOUND");
    if (order.buyerId !== user.id || !new Set<OrderStatus>([OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED]).has(order.status)) throw new Error("INVALID_STATE");
    const proof = await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id, buyerId: user.id, status: { in: [OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED] } }, data: { status: OrderStatus.PAYMENT_REVIEW } });
      if (changed.count !== 1) throw new Error("INVALID_STATE");
      return tx.paymentProof.create({ data: { orderId: id, method: input.method, reference: input.reference, fileKey: input.fileKey, fileUrl: input.fileUrl } });
    });
    await audit({ actorId: user.id, action: "PAYMENT_PROOF_SUBMITTED", entityType: "PaymentProof", entityId: proof.id, metadata: { orderId: id } });
    return jsonOk(serialize(proof), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
