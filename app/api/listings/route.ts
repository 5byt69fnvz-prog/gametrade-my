import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { listingCreateSchema } from "@/lib/validators";
import { publicUserSelect, serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId") || undefined;
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", stock: { gt: 0 }, ...(gameId ? { gameId } : {}) },
    include: { game: true, gameVariant: true, seller: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return jsonOk(serialize(listings));
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const input = await parseJson(request, listingCreateSchema);
    const game = await db.game.findUnique({
      where: { id: input.gameId },
      include: { variants: { where: { active: true } }, productTypes: { where: { active: true } } }
    });
    if (!game || !game.active) throw new Error("NOT_FOUND");
    const variant = input.gameVariantId ? game.variants.find((item) => item.id === input.gameVariantId) : null;
    if (game.selectionMode !== "NONE" && !variant) throw new Error("VALIDATION_ERROR");
    const productType = game.productTypes.find((item) => item.code === input.type);
    if (!productType || productType.riskStatus === "DISABLED") throw new Error("VALIDATION_ERROR");
    if (productType.riskStatus === "REVIEW_REQUIRED" && !input.termsRiskAcknowledged) throw new Error("VALIDATION_ERROR");
    const listing = await db.$transaction(async (tx) => {
      if (user.role === UserRole.BUYER) await tx.user.update({ where: { id: user.id }, data: { role: UserRole.SELLER } });
      await tx.sellerProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, shopName: input.shopName || `${user.name}'s Shop` },
        update: input.shopName ? { shopName: input.shopName } : {}
      });
      return tx.listing.create({
        data: {
          gameId: input.gameId,
          gameVariantId: variant?.id,
          sellerId: user.id,
          type: input.type,
          title: input.title,
          description: input.description,
          price: input.price,
          stock: input.stock,
          deliveryMins: input.deliveryMins,
          tags: input.tags,
          riskStatus: productType.riskStatus,
          termsRiskAcknowledged: input.termsRiskAcknowledged
        }
      });
    });
    await audit({ actorId: user.id, action: "LISTING_SUBMITTED", entityType: "Listing", entityId: listing.id });
    return jsonOk(serialize(listing), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
