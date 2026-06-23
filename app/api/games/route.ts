import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk } from "@/lib/http";
import { serialize } from "@/lib/serializers";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category")?.trim();
  const games = await db.game.findMany({
    where: {
      active: true,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
      ...(category ? { category: { slug: category } } : {})
    },
    include: { category: true, variants: { where: { active: true }, orderBy: { sortOrder: "asc" } }, productTypes: { where: { active: true }, orderBy: { sortOrder: "asc" } }, _count: { select: { listings: { where: { status: "ACTIVE" } } } } },
    orderBy: [{ heat: "desc" }, { name: "asc" }]
  });
  return jsonOk(serialize(games));
}
