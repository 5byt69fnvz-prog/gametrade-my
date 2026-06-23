import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { serialize } from "@/lib/serializers";

export async function GET() {
  try {
    await requireAdmin();
    const proofs = await db.paymentProof.findMany({
      include: { order: { include: { listing: { include: { game: true } }, buyer: { select: { id: true, name: true, email: true, phone: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    return jsonOk(serialize(proofs));
  } catch (error) {
    return apiError(error);
  }
}
