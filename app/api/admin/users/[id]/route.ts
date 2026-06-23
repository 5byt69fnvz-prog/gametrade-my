import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { serialize } from "@/lib/serializers";
import { walletBalance } from "@/lib/wallet";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const [user, balance] = await Promise.all([
      db.user.findUnique({
        where: { id },
        select: {
          id: true, role: true, name: true, email: true, phone: true, emailVerified: true,
          phoneVerified: true, primaryVerification: true, realNameVerified: true, banned: true,
          bannedAt: true, riskFlags: true, createdAt: true, updatedAt: true, sellerProfile: true,
          listings: { orderBy: { createdAt: "desc" }, take: 30 },
          purchases: { orderBy: { createdAt: "desc" }, take: 30 },
          sales: { orderBy: { createdAt: "desc" }, take: 30 },
          withdrawals: { orderBy: { createdAt: "desc" }, take: 30 },
          otpChallenges: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, channel: true, purpose: true, destination: true, attempts: true, deliveryStatus: true, expiresAt: true, verifiedAt: true, createdAt: true } }
        }
      }),
      walletBalance(id)
    ]);
    if (!user) throw new Error("NOT_FOUND");
    return jsonOk(serialize({ user, balance }));
  } catch (error) {
    return apiError(error);
  }
}
