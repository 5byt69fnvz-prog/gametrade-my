import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { serialize } from "@/lib/serializers";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVerifiedUser();
    const { id } = await context.params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        listing: { include: { game: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, sellerProfile: true } },
        paymentProofs: true,
        disputes: true,
        messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } }
      }
    });
    if (!order) throw new Error("NOT_FOUND");
    if (user.role !== UserRole.ADMIN && order.buyerId !== user.id && order.sellerId !== user.id) throw new Error("FORBIDDEN");
    return jsonOk(serialize(order));
  } catch (error) {
    return apiError(error);
  }
}
