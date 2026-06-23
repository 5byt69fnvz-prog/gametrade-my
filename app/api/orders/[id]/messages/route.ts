import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { messageSchema } from "@/lib/validators";
import { serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

const privateDealPattern = /(whatsapp|telegram|bank\s?in|outside|direct|私下|私账|转账给我|pm\s?tepi|luar\s?platform)/i;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const { id } = await context.params;
    const input = await parseJson(request, messageSchema);
    const order = await db.order.findUnique({ where: { id }, select: { buyerId: true, sellerId: true } });
    if (!order) throw new Error("NOT_FOUND");
    if (user.role !== UserRole.ADMIN && order.buyerId !== user.id && order.sellerId !== user.id) throw new Error("FORBIDDEN");
    const riskFlag = privateDealPattern.test(input.body);
    const message = await db.$transaction(async (tx) => {
      if (riskFlag) await tx.user.update({ where: { id: user.id }, data: { riskFlags: { increment: 1 } } });
      return tx.message.create({ data: { orderId: id, senderId: user.id, body: input.body, riskFlag } });
    });
    if (riskFlag) await audit({ actorId: user.id, action: "PRIVATE_DEAL_KEYWORD", entityType: "Message", entityId: message.id, metadata: { orderId: id } });
    return jsonOk(serialize(message), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
