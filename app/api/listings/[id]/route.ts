import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { publicUserSelect, serialize } from "@/lib/serializers";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const listing = await db.listing.findFirst({
      where: { id, status: "ACTIVE" },
      include: { game: { include: { category: true } }, seller: { select: publicUserSelect } }
    });
    if (!listing) throw new Error("NOT_FOUND");
    return jsonOk(serialize(listing));
  } catch (error) {
    return apiError(error);
  }
}
