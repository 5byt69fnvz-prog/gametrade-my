import { NextRequest } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { orderCreateSchema } from "@/lib/validators";
import { serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireVerifiedUser();
    const orders = await db.order.findMany({
      where: user.role === UserRole.ADMIN ? {} : { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: { listing: { include: { game: true } }, paymentProofs: true, disputes: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return jsonOk(serialize(orders));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const buyer = await requireVerifiedUser();
    const input = await parseJson(request, orderCreateSchema);
    const existing = await db.order.findUnique({ where: { clientRequestId: input.clientRequestId } });
    if (existing) return jsonOk(serialize(existing));
    const order = await db.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: input.listingId } });
      if (!listing || listing.status !== "ACTIVE" || listing.stock < 1) throw new Error("NOT_FOUND");
      if (listing.sellerId === buyer.id) throw new Error("INVALID_STATE");
      const reserved = await tx.listing.updateMany({
        where: { id: listing.id, status: "ACTIVE", stock: { gt: 0 } },
        data: { stock: { decrement: 1 } }
      });
      if (reserved.count !== 1) throw new Error("INVALID_STATE");
      const amount = new Prisma.Decimal(listing.price);
      const fee = amount.mul(new Prisma.Decimal("0.05")).toDecimalPlaces(2);
      return tx.order.create({
        data: {
          clientRequestId: input.clientRequestId,
          listingId: listing.id,
          buyerId: buyer.id,
          sellerId: listing.sellerId,
          amount,
          fee,
          paymentMethod: input.paymentMethod,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }
      });
    });
    await audit({ actorId: buyer.id, action: "ORDER_CREATED", entityType: "Order", entityId: order.id });
    return jsonOk(serialize(order), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
