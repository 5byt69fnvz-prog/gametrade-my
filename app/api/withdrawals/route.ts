import { NextRequest } from "next/server";
import { LedgerType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { withdrawalSchema } from "@/lib/validators";
import { walletBalance } from "@/lib/wallet";
import { serialize } from "@/lib/serializers";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const input = await parseJson(request, withdrawalSchema);
    const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(2);
    const withdrawal = await db.$transaction(async (tx) => {
      const balance = await walletBalance(user.id, tx);
      if (balance.lessThan(amount)) throw new Error("INSUFFICIENT_BALANCE");
      const created = await tx.withdrawal.create({ data: { userId: user.id, amount, account: input.account } });
      await tx.walletLedger.create({ data: { userId: user.id, type: LedgerType.HOLD, amount, note: `Withdrawal hold ${created.id}` } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await audit({ actorId: user.id, action: "WITHDRAWAL_REQUESTED", entityType: "Withdrawal", entityId: withdrawal.id });
    return jsonOk(serialize(withdrawal), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
