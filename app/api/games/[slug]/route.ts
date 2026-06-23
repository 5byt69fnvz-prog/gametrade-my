import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { publicUserSelect, serialize } from "@/lib/serializers";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const game = await db.game.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        productTypes: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        listings: {
          where: { status: "ACTIVE", stock: { gt: 0 } },
          include: { gameVariant: true, seller: { select: publicUserSelect } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!game || !game.active) throw new Error("NOT_FOUND");
    return jsonOk(serialize(game));
  } catch (error) {
    return apiError(error);
  }
}
