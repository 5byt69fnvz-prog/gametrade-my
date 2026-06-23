import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { serialize } from "@/lib/serializers";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: {
        id: true, role: true, name: true, email: true, phone: true, emailVerified: true,
        phoneVerified: true, primaryVerification: true, banned: true, riskFlags: true,
        createdAt: true, sellerProfile: true,
        _count: { select: { purchases: true, sales: true, listings: true, otpChallenges: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return jsonOk(serialize(users));
  } catch (error) {
    return apiError(error);
  }
}
