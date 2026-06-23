import { LedgerType, OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const paymentExpired = await db.order.findMany({
    where: { status: { in: [OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED] }, expiresAt: { lt: now } },
    select: { id: true, listingId: true }
  });
  for (const order of paymentExpired) {
    await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: { in: [OrderStatus.PAYMENT_REVIEW, OrderStatus.PAYMENT_REJECTED] } }, data: { status: OrderStatus.CANCELLED, cancelledAt: now, expiresAt: null } });
      if (changed.count) await tx.listing.update({ where: { id: order.listingId }, data: { stock: { increment: 1 } } });
    });
  }

  const deliveryExpired = await db.order.findMany({ where: { status: OrderStatus.AWAITING_DELIVERY, expiresAt: { lt: now } }, select: { id: true, buyerId: true } });
  for (const order of deliveryExpired) {
    await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: OrderStatus.AWAITING_DELIVERY }, data: { status: OrderStatus.DISPUTED, expiresAt: null } });
      if (changed.count) await tx.dispute.create({ data: { orderId: order.id, openedById: order.buyerId, reason: "Seller delivery deadline expired. Automatic administrator review required." } });
    });
  }

  const acceptanceExpired = await db.order.findMany({ where: { status: OrderStatus.DELIVERED, expiresAt: { lt: now } } });
  for (const order of acceptanceExpired) {
    await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: OrderStatus.DELIVERED }, data: { status: OrderStatus.COMPLETED, completedAt: now, expiresAt: null } });
      if (changed.count) {
        const net = new Prisma.Decimal(order.amount).minus(order.fee);
        await tx.walletLedger.create({ data: { userId: order.sellerId, orderId: order.id, type: LedgerType.CREDIT, amount: net, note: `Order ${order.id} auto-completed after acceptance window` } });
        await tx.sellerProfile.updateMany({ where: { userId: order.sellerId }, data: { completedOrders: { increment: 1 } } });
      }
    });
  }

  return Response.json({ ok: true, data: { paymentExpired: paymentExpired.length, deliveryExpired: deliveryExpired.length, acceptanceExpired: acceptanceExpired.length } });
}
