import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { publicUserSelect, serialize } from "@/lib/serializers";

export async function GET() {
  try {
    await requireAdmin();
    const listings = await db.listing.findMany({ include: { game: true, seller: { select: publicUserSelect } }, orderBy: { createdAt: "desc" }, take: 200 });
    return jsonOk(serialize(listings));
  } catch (error) {
    return apiError(error);
  }
}
