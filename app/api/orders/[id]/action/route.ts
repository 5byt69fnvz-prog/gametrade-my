import { NextRequest } from "next/server";
import { LedgerType, OrderStatus, Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { orderActionSchema } from "@/lib/validators";
import { serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const { id } = await context.params;
    const input = await parseJson(request, orderActionSchema);
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw new Error("NOT_FOUND");
    if (user.role !== UserRole.ADMIN && order.buyerId !== user.id && order.sellerId !== user.id) throw new Error("FORBIDDEN");

    if (input.action === "DELIVER") {
      if (order.sellerId !== user.id || order.status !== OrderStatus.AWAITING_DELIVERY || !input.deliverySecret) throw new Error("INVALID_STATE");
      const changed = await db.order.updateMany({ where: { id, status: OrderStatus.AWAITING_DELIVERY }, data: { status: OrderStatus.DELIVERED, deliverySecret: input.deliverySecret, deliveredAt: new Date(), expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) } });
      if (changed.count !== 1) throw new Error("INVALID_STATE");
    }

    if (input.action === "ACCEPT") {
      if (order.buyerId !== user.id || order.status !== OrderStatus.DELIVERED) throw new Error("INVALID_STATE");
      await db.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({ where: { id, status: OrderStatus.DELIVERED }, data: { status: OrderStatus.COMPLETED, buyerAcceptedAt: new Date(), completedAt: new Date(), expiresAt: null } });
        if (updated.count !== 1) throw new Error("INVALID_STATE");
        const net = new Prisma.Decimal(order.amount).minus(order.fee);
        await tx.walletLedger.create({ data: { userId: order.sellerId, orderId: order.id, type: LedgerType.CREDIT, amount: net, note: `Order ${order.id} completed` } });
        await tx.sellerProfile.updateMany({ where: { userId: order.sellerId }, data: { completedOrders: { increment: 1 } } });
      });
    }

    if (input.action === "DISPUTE") {
      if (!new Set<OrderStatus>([OrderStatus.AWAITING_DELIVERY, OrderStatus.DELIVERED]).has(order.status) || !input.reason) throw new Error("INVALID_STATE");
      await db.$transaction(async (tx) => {
        const changed = await tx.order.updateMany({ where: { id, status: { in: [OrderStatus.AWAITING_DELIVERY, OrderStatus.DELIVERED] } }, data: { status: OrderStatus.DISPUTED, expiresAt: null } });
        if (changed.count !== 1) throw new Error("INVALID_STATE");
        await tx.dispute.create({ data: { orderId: id, openedById: user.id, reason: input.reason! } });
      });
    }

    if (input.action === "CANCEL") {
      if (order.buyerId !== user.id || !new Set<OrderStatus>([OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED]).has(order.status)) throw new Error("INVALID_STATE");
      await db.$transaction(async (tx) => {
        const changed = await tx.order.updateMany({ where: { id, status: { in: [OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED] } }, data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), expiresAt: null } });
        if (changed.count !== 1) throw new Error("INVALID_STATE");
        await tx.listing.update({ where: { id: order.listingId }, data: { stock: { increment: 1 } } });
      });
    }

    await audit({ actorId: user.id, action: `ORDER_${input.action}`, entityType: "Order", entityId: id });
    return jsonOk(serialize(await db.order.findUnique({ where: { id } })));
  } catch (error) {
    return apiError(error);
  }
}
