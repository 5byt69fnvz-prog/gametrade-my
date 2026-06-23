import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { SellForm } from "@/components/SellForm";

export default async function SellPage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const user = await currentUser(); if (!user) redirect("/auth"); if (!user.emailVerified) redirect("/verify");
  const [games, params] = await Promise.all([db.game.findMany({ where: { active: true }, select: { id: true, name: true, selectionMode: true, variants: { where: { active: true }, select: { id: true, label: true }, orderBy: { sortOrder: "asc" } }, productTypes: { where: { active: true }, select: { code: true, labelZh: true, riskStatus: true }, orderBy: { sortOrder: "asc" } } }, orderBy: [{ isService: "asc" }, { name: "asc" }] }), searchParams]);
  return <div className="narrow seller-page"><div className="page-title"><div><p className="eyebrow">SELLER CENTER</p><h1>发布商品</h1><p>选择正确游戏与区服，提供清楚的交付资料。所有新商品都会先经过管理员审核。</p></div><span className="status good">Email 已验证</span></div><div className="notice coral" style={{ marginBottom: 18 }}><strong>请只在平台内交易。</strong> 禁止引导私下付款、发布盗取账号或来源不明的数字内容。</div><SellForm games={games} initialGame={params.game}/></div>;
}
