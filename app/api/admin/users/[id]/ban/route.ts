import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { banSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const admin = await requireAdmin();
    const { id } = await context.params;
    const input = await parseJson(request, banSchema);
    if (id === admin.id && input.banned) throw new Error("INVALID_STATE");
    const user = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: { banned: input.banned, bannedAt: input.banned ? new Date() : null } });
      if (input.banned) await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return updated;
    });
    await audit({ actorId: admin.id, action: input.banned ? "USER_BANNED" : "USER_UNBANNED", entityType: "User", entityId: id, metadata: { reason: input.reason } });
    return jsonOk({ id: user.id, banned: user.banned });
  } catch (error) {
    return apiError(error);
  }
}
