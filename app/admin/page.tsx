import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { serialize } from "@/lib/serializers";
import { AdminConsole } from "@/components/AdminConsole";

export default async function AdminPage() {
  const user = await currentUser(); if (!user) redirect("/auth"); if (user.role !== "ADMIN") redirect("/");
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [users, listings, proofs, withdrawals, disputes, riskyMessages, largeOrders, refunds, sessions] = await Promise.all([
    db.user.findMany({ select: { id: true, role: true, name: true, email: true, phone: true, emailVerified: true, phoneVerified: true, primaryVerification: true, banned: true, riskFlags: true, createdAt: true, _count: { select: { purchases: true, sales: true, listings: true, otpChallenges: true } } }, orderBy: { createdAt: "desc" }, take: 500 }),
    db.listing.findMany({ include: { game: true, gameVariant: true, seller: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.paymentProof.findMany({ include: { order: { include: { listing: { include: { game: true } }, buyer: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.withdrawal.findMany({ include: { user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.dispute.findMany({ include: { order: { include: { listing: { include: { game: true } }, buyer: { select: { id: true, name: true } }, seller: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.message.count({ where: { riskFlag: true, createdAt: { gte: since30d } } }),
    db.order.count({ where: { amount: { gte: 1000 }, createdAt: { gte: since30d } } }),
    db.order.count({ where: { status: "REFUNDED", createdAt: { gte: since30d } } }),
    db.session.findMany({ where: { createdAt: { gte: since30d }, ipHash: { not: null } }, select: { ipHash: true } })
  ]);
  const ipCounts = sessions.reduce<Record<string, number>>((acc, item) => { if (item.ipHash) acc[item.ipHash] = (acc[item.ipHash] || 0) + 1; return acc; }, {});
  const repeatedDevices = Object.values(ipCounts).filter((count) => count >= 3).length;
  const recentUsers = users.filter((item) => item.createdAt >= since24h).length;
  const data = serialize({ users, listings, proofs, withdrawals, disputes });
  return <div className="container admin-page"><div className="page-title"><div><p className="eyebrow">RISK & OPERATIONS</p><h1>管理员风险驾驶舱</h1><p>把客户、商品、付款、提款、纠纷和异常信号放在同一个运营视图。</p></div><span className="status good">系统监控正常</span></div>
    <div className="risk-metrics"><div><span>新注册 / 24h</span><strong>{recentUsers}</strong><small>需要观察的新客户</small></div><div><span>重复设备</span><strong>{repeatedDevices}</strong><small>同一网络出现 3+ 会话</small></div><div><span>大额交易</span><strong>{largeOrders}</strong><small>近 30 天 RM 1,000+</small></div><div className={riskyMessages ? "alert" : ""}><span>私下交易关键词</span><strong>{riskyMessages}</strong><small>近 30 天聊天预警</small></div><div><span>频繁退款</span><strong>{refunds}</strong><small>近 30 天退款订单</small></div></div>
    <section className="risk-queue"><div><h2>今日优先处理</h2><p>系统根据金额、关键词、退款与验证状态集中显示风险。</p></div><div className="risk-signal"><span className="signal-dot coral-dot"/><div><strong>{listings.filter((item) => item.status === "PENDING_REVIEW" && item.riskStatus === "REVIEW_REQUIRED").length} 个账号商品待人工审核</strong><p>核对来源、改绑范围和区服资料。</p></div><b>高优先级</b></div><div className="risk-signal"><span className="signal-dot amber-dot"/><div><strong>{proofs.filter((item) => item.status === "PENDING").length} 笔付款凭证等待确认</strong><p>确认到账后才通知卖家交付。</p></div><b>运营队列</b></div><div className="risk-signal"><span className="signal-dot green-dot"/><div><strong>{users.filter((item) => item.banned).length} 个账号当前被封禁</strong><p>可从客户档案查看风险与订单历史。</p></div><b>持续监控</b></div></section>
    <AdminConsole data={data}/>
  </div>;
}
