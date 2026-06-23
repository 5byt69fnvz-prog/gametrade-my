import "server-only";
import { LedgerType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const additions = new Set<LedgerType>([LedgerType.CREDIT, LedgerType.REFUND, LedgerType.RELEASE]);

export async function walletBalance(userId: string, tx: Prisma.TransactionClient | typeof db = db) {
  const rows = await tx.walletLedger.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true }
  });
  return rows.reduce((balance, row) => {
    const amount = row._sum.amount || new Prisma.Decimal(0);
    return additions.has(row.type) ? balance.plus(amount) : balance.minus(amount);
  }, new Prisma.Decimal(0));
}
