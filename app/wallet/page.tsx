import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { walletBalance } from "@/lib/wallet";
import { WithdrawalForm } from "@/components/WithdrawalForm";

export default async function WalletPage() {
  const user = await currentUser(); if (!user) redirect("/auth"); if (!user.emailVerified) redirect("/verify");
  const [balance, ledgers, withdrawals, sellerProfile, activeListings, pendingListings, completedSales] = await Promise.all([
    walletBalance(user.id),
    db.walletLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.withdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.sellerProfile.findUnique({ where: { userId: user.id } }),
    db.listing.count({ where: { sellerId: user.id, status: "ACTIVE" } }),
    db.listing.count({ where: { sellerId: user.id, status: "PENDING_REVIEW" } }),
    db.order.count({ where: { sellerId: user.id, status: "COMPLETED" } })
  ]);
  return <div className="container"><div className="wallet-hero"><div><p className="eyebrow">MY WALLET</p><h1>钱包与卖家中心</h1><p>余额、商品审核与卖家信誉集中在同一个工作区。</p></div><div><span>可用余额</span><strong>RM {balance.toFixed(2)}</strong><small>Email 已验证 · 人工提款审核</small></div></div><section className="seller-hub"><div className="seller-hub-head"><div><span className="status good">卖家信誉护照</span><h2>{sellerProfile?.shopName || "开始你的卖家档案"}</h2><p>验证状态、成交表现和商品审核状态会共同形成可解释的信誉等级。</p></div><a className="button primary" href="/sell">发布商品</a></div><div className="seller-hub-metrics"><div><span>信誉等级</span><strong>{sellerProfile?.trustGrade || "B"}</strong><small>Email 已验证</small></div><div><span>历史成交</span><strong>{sellerProfile?.completedOrders || completedSales}</strong><small>完成订单</small></div><div><span>准时交付率</span><strong>{sellerProfile ? `${Number(sellerProfile.onTimeRate).toFixed(0)}%` : "--"}</strong><small>按承诺时间交付</small></div><div><span>在售商品</span><strong>{activeListings}</strong><small>{pendingListings} 件审核中</small></div><div><span>响应速度</span><strong>{sellerProfile ? `${sellerProfile.responseMins} 分钟` : "--"}</strong><small>近期平均</small></div></div></section><div className="wallet-layout"><section className="stack"><div className="panel"><div className="panel-title"><h2>资金流水</h2><span>最近 {ledgers.length} 笔</span></div>{ledgers.length ? ledgers.map((row) => <div className="data-row" key={row.id}><div><strong>{row.note}</strong><p className="muted">{new Date(row.createdAt).toLocaleString("zh-MY")}</p></div><div><span className={row.type === "CREDIT" || row.type === "REFUND" || row.type === "RELEASE" ? "status good" : "status warn"}>{row.type}</span><div className="price">RM {row.amount.toFixed(2)}</div></div></div>) : <div className="empty">还没有钱包流水。</div>}</div><div className="panel"><div className="panel-title"><h2>提款记录</h2><span>管理员人工处理</span></div>{withdrawals.length ? withdrawals.map((row) => <div className="data-row" key={row.id}><div><strong>RM {row.amount.toFixed(2)}</strong><p className="muted">{row.account}</p></div><span className={row.status === "PAID" ? "status good" : row.status === "REJECTED" ? "status bad" : "status warn"}>{row.status}</span></div>) : <p className="muted">还没有提款申请。</p>}</div></section><aside><WithdrawalForm balance={balance.toFixed(2)}/><div className="panel wallet-safety"><h3>提款安全</h3><ul className="check-list"><li>仅允许 Email 已验证账号申请</li><li>管理员核对收款资料后处理</li><li>每笔状态变化保留资金流水</li></ul></div></aside></div></div>;
}
