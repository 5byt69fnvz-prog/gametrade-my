import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { OrderActions } from "@/components/OrderActions";
import { OrderCountdown } from "@/components/OrderCountdown";

const steps = [
  ["PAYMENT_REVIEW", "付款审核", "买家付款并提交凭证"], ["AWAITING_DELIVERY", "等待交付", "管理员确认入账"], ["DELIVERED", "买家验收", "卖家已提交交付"], ["COMPLETED", "交易完成", "款项进入卖家余额"]
] as const;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) redirect("/auth"); if (!user.emailVerified) redirect("/verify");
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { listing: { include: { game: true, gameVariant: true } }, buyer: { select: { id: true, name: true } }, seller: { select: { id: true, name: true, sellerProfile: true } }, paymentProofs: { orderBy: { createdAt: "desc" } }, disputes: true, messages: { include: { sender: { select: { name: true } } }, orderBy: { createdAt: "asc" } } } });
  if (!order) notFound(); if (user.role !== "ADMIN" && order.buyerId !== user.id && order.sellerId !== user.id) notFound();
  const current = Math.max(0, steps.findIndex(([status]) => status === order.status));
  const awaitingPayment = order.buyerId === user.id && ["PAYMENT_REVIEW", "PAYMENT_REJECTED"].includes(order.status);
  return <div className="container order-room"><div className="order-room-head"><div><div className="actions"><span className="status good">安全交易房</span><span className="status">订单 {order.id.slice(-8).toUpperCase()}</span></div><h1>{order.listing.title}</h1><p>{order.listing.game.name} · {order.listing.gameVariant?.label || "通用区服"} · 买家 {order.buyer.name} / 卖家 {order.seller.name}</p></div><div className="countdown-card"><span>当前步骤剩余</span><OrderCountdown expiresAt={order.expiresAt?.toISOString() || null}/><small>{order.status}</small></div></div>
    <div className="order-progress">{steps.map(([key, label, note], index) => <div className={index < current ? "done" : index === current ? "active" : ""} key={key}><span>{index < current ? "✓" : index + 1}</span><strong>{label}</strong><small>{note}</small></div>)}</div>
    <div className="order-layout"><main><OrderActions orderId={order.id} status={order.status} isBuyer={order.buyerId === user.id} isSeller={order.sellerId === user.id} messages={order.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))}/></main><aside className="stack"><div className="panel order-money"><span>订单金额</span><strong>RM {order.amount.toFixed(2)}</strong><small>平台服务费 RM {order.fee.toFixed(2)}</small></div>{awaitingPayment && <div className="panel"><div className="panel-title"><h3>平台收款资料</h3><span className="status warn">待付款</span></div><div className="bank-details"><strong>{process.env.PAYMENT_BANK_NAME || "银行账户待管理员配置"}</strong><span>{process.env.PAYMENT_BANK_ACCOUNT || "请联系管理员确认收款账号"}</span><span>DuitNow: {process.env.PAYMENT_DUITNOW_ID || "未配置"}</span></div><div className="notice coral">只向本页显示的平台账户付款，不要向卖家或聊天中的私人账户转账。</div></div>}{order.deliverySecret && (order.buyerId === user.id || user.role === "ADMIN") && <div className="panel"><div className="panel-title"><h3>卖家交付资料</h3><span className="status good">已交付</span></div><div className="delivery-secret">{order.deliverySecret}</div></div>}<div className="panel"><div className="panel-title"><h3>付款与证据</h3><span>{order.paymentProofs.length} 项</span></div>{order.paymentProofs.length ? order.paymentProofs.map((proof) => <div className="evidence-row" key={proof.id}><span className="payment-mark bank">✓</span><div><strong>{proof.method}</strong><small>{proof.reference}</small></div><span className={`status ${proof.status === "APPROVED" ? "good" : proof.status === "REJECTED" ? "bad" : "warn"}`}>{proof.status}</span></div>) : <p className="muted">尚未提交付款凭证。</p>}</div>{order.disputes.length > 0 && <div className="panel dispute-panel"><h3>申诉时间线</h3>{order.disputes.map((item) => <div className="timeline-item done" key={item.id}><strong>{item.status}</strong><p>{item.reason}</p><small>{new Date(item.createdAt).toLocaleString("zh-MY")}</small></div>)}</div>}</aside></div>
  </div>;
}
