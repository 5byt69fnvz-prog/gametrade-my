import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";

export default async function OrdersPage() {
  const user = await currentUser(); if (!user) redirect("/auth"); if (!user.emailVerified) redirect("/verify");
  const orders = await db.order.findMany({ where: user.role === "ADMIN" ? {} : { OR: [{ buyerId: user.id }, { sellerId: user.id }] }, include: { listing: { include: { game: true, gameVariant: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="container"><div className="page-title"><div><p className="eyebrow">ORDER WORKSPACE</p><h1>我的订单</h1><p>付款、交付、验收、聊天与申诉都保留在安全交易房。</p></div><span className="count-badge">{orders.length} 笔订单</span></div><div className="panel order-list">{orders.length ? orders.map((order) => <Link href={`/orders/${order.id}`} className="order-row" key={order.id}><span className="order-game-mark">{order.listing.game.name.slice(0, 1)}</span><div><h3>{order.listing.title}</h3><p>{order.listing.game.name} · {order.listing.gameVariant?.label || "通用"} · {order.buyerId === user.id ? "我是买家" : "我是卖家"}</p><small>{new Date(order.createdAt).toLocaleString("zh-MY")}</small></div><strong>RM {order.amount.toFixed(2)}</strong><span className={order.status === "COMPLETED" ? "status good" : order.status === "DISPUTED" ? "status bad" : "status warn"}>{order.status}</span><b>›</b></Link>) : <div className="empty"><strong>目前没有订单</strong><p>浏览游戏市场，从商品详情建立第一笔订单。</p><Link className="button primary" href="/games">浏览游戏</Link></div>}</div></div>;
}
