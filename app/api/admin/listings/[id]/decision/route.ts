import { NextRequest } from "next/server";
import { ListingImageStatus, ListingStatus } from "@prisma/client";
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
    const approved = input.decision === "APPROVE";
    const listing = await db.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id },
        data: { status: approved ? ListingStatus.ACTIVE : ListingStatus.REJECTED, reviewNote: input.note, reviewedById: admin.id, reviewedAt: new Date() }
      });
      await tx.listingImage.updateMany({
        where: { listingId: id },
        data: { status: approved ? ListingImageStatus.APPROVED : ListingImageStatus.REJECTED }
      });
      return updated;
    });
    await audit({ actorId: admin.id, action: `LISTING_${input.decision}D`, entityType: "Listing", entityId: id, metadata: { note: input.note } });
    return jsonOk(serialize(listing));
  } catch (error) {
    return apiError(error);
  }
}
