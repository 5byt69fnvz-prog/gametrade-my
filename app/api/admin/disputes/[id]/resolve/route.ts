import { NextRequest } from "next/server";
import { DisputeStatus, LedgerType, OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { disputeResolutionSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { serialize } from "@/lib/serializers";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const admin = await requireAdmin();
    const { id } = await context.params;
    const input = await parseJson(request, disputeResolutionSchema);
    const dispute = await db.dispute.findUnique({ where: { id }, include: { order: true } });
    if (!dispute) throw new Error("NOT_FOUND");
    if (dispute.order.status !== OrderStatus.DISPUTED || !new Set<DisputeStatus>([DisputeStatus.OPEN, DisputeStatus.REVIEWING]).has(dispute.status)) throw new Error("INVALID_STATE");
    const updated = await db.$transaction(async (tx) => {
      const buyerWins = input.resolution === "BUYER";
      const changed = await tx.order.updateMany({ where: { id: dispute.orderId, status: OrderStatus.DISPUTED }, data: { status: buyerWins ? OrderStatus.REFUNDED : OrderStatus.COMPLETED, completedAt: buyerWins ? null : new Date() } });
      if (changed.count !== 1) throw new Error("INVALID_STATE");
      if (buyerWins) {
        await tx.listing.update({ where: { id: dispute.order.listingId }, data: { stock: { increment: 1 } } });
      } else {
        const net = new Prisma.Decimal(dispute.order.amount).minus(dispute.order.fee);
        await tx.walletLedger.create({ data: { userId: dispute.order.sellerId, orderId: dispute.orderId, type: LedgerType.CREDIT, amount: net, note: `Dispute resolved for seller ${dispute.orderId}` } });
      }
      return tx.dispute.update({
        where: { id },
        data: { status: buyerWins ? DisputeStatus.RESOLVED_BUYER : DisputeStatus.RESOLVED_SELLER, note: input.note, resolvedById: admin.id, resolvedAt: new Date() }
      });
    });
    await audit({ actorId: admin.id, action: `DISPUTE_RESOLVED_${input.resolution}`, entityType: "Dispute", entityId: id, metadata: { note: input.note } });
    return jsonOk(serialize(updated));
  } catch (error) {
    return apiError(error);
  }
}
