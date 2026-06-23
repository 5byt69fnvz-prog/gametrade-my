import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { serialize } from "@/lib/serializers";
import { walletBalance } from "@/lib/wallet";

export async function GET() {
  try {
    const user = await requireVerifiedUser();
    const [balance, ledgers, withdrawals] = await Promise.all([
      walletBalance(user.id),
      db.walletLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.withdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 })
    ]);
    return jsonOk(serialize({ balance, ledgers, withdrawals }));
  } catch (error) {
    return apiError(error);
  }
}
