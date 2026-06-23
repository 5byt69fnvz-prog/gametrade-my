import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { serialize } from "@/lib/serializers";

export async function GET() {
  try {
    await requireAdmin();
    const withdrawals = await db.withdrawal.findMany({ include: { user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
    return jsonOk(serialize(withdrawals));
  } catch (error) {
    return apiError(error);
  }
}
