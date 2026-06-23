"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

type AdminData = { users: any[]; listings: any[]; proofs: any[]; withdrawals: any[]; disputes: any[] };

export function AdminConsole({ data }: { data: AdminData }) {
  const router = useRouter();
  const [tab, setTab] = useState("users");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function act(key: string, url: string, body: unknown) {
    setBusy(key);
    setError("");
    try {
      await api(url, { method: "POST", body: JSON.stringify(body) });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作失败");
    } finally {
      setBusy("");
    }
  }

  const tabs = [
    ["users", `客户 ${data.users.length}`],
    ["listings", `商品 ${data.listings.filter((v) => v.status === "PENDING_REVIEW").length}`],
    ["proofs", `付款 ${data.proofs.filter((v) => v.status === "PENDING").length}`],
    ["withdrawals", `提款 ${data.withdrawals.filter((v) => v.status === "PENDING").length}`],
    ["disputes", `纠纷 ${data.disputes.filter((v) => ["OPEN", "REVIEWING"].includes(v.status)).length}`]
  ];

  return <>
    <div className="admin-tabs">
      {tabs.map(([id, label]) => <button key={id} className={tab === id ? "button gold compact" : "button compact"} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {error && <p className="form-error">{error}</p>}

    {tab === "users" && <div className="panel table-wrap"><table className="data-table"><thead><tr><th>客户</th><th>Email 验证</th><th>角色</th><th>订单</th><th>风险</th><th>状态</th><th>操作</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><br/><span className="muted">{user.email}{user.phone ? <><br/>{user.phone}</> : null}</span></td><td><span className={user.emailVerified ? "status good" : "status warn"}>{user.emailVerified ? "已验证" : "待验证"}</span></td><td>{user.role}</td><td>{user._count.purchases + user._count.sales}</td><td>{user.riskFlags}</td><td><span className={user.banned ? "status bad" : "status good"}>{user.banned ? "已封禁" : "正常"}</span></td><td className="actions"><Link className="button compact" href={`/admin/users/${user.id}`}>查看</Link><button className={user.banned ? "button compact" : "button danger compact"} disabled={Boolean(busy)} onClick={() => act(`ban-${user.id}`, `/api/admin/users/${user.id}/ban`, { banned: !user.banned, reason: "Admin console action" })}>{busy === `ban-${user.id}` ? "..." : user.banned ? "解封" : "封禁"}</button></td></tr>)}</tbody></table></div>}

    {tab === "listings" && <div className="panel table-wrap"><table className="data-table"><thead><tr><th>商品</th><th>证明图</th><th>卖家</th><th>价格</th><th>状态</th><th>操作</th></tr></thead><tbody>{data.listings.map((row) => <tr key={row.id}><td><strong>{row.title}</strong><br/><span className="muted">{row.game.name} · {row.gameVariant?.label || "通用"} · {row.type}</span></td><td>{row.images?.length ? <div className="admin-image-strip">{row.images.slice(0, 4).map((image: any) => <a key={image.id} href={`/api/listing-images/${image.id}/file`} target="_blank" rel="noreferrer"><img src={`/api/listing-images/${image.id}/file`} alt={image.altText || row.title}/></a>)}</div> : <span className="status warn">无图</span>}</td><td>{row.seller.name}</td><td className="price">RM {row.price}</td><td><span className="status">{row.status}</span></td><td className="actions">{row.status === "PENDING_REVIEW" && <><button className="button gold compact" disabled={Boolean(busy)} onClick={() => act(`la-${row.id}`, `/api/admin/listings/${row.id}/decision`, { decision: "APPROVE" })}>通过</button><button className="button danger compact" disabled={Boolean(busy)} onClick={() => act(`lr-${row.id}`, `/api/admin/listings/${row.id}/decision`, { decision: "REJECT", note: "不符合平台发布规则" })}>拒绝</button></>}</td></tr>)}</tbody></table></div>}

    {tab === "proofs" && <div className="panel table-wrap"><table className="data-table"><thead><tr><th>订单 / 买家</th><th>付款资料</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>{data.proofs.map((row) => <tr key={row.id}><td>{row.order.listing.game.name}<br/><span className="muted">{row.order.buyer.name} · {row.order.id}</span></td><td>{row.method}<br/><strong>{row.reference}</strong>{row.fileKey && <><br/><a className="section-link" href={`/api/admin/payment-proofs/${row.id}/file`} target="_blank">查看凭证</a></>}</td><td className="price">RM {row.order.amount}</td><td><span className="status">{row.status}</span></td><td className="actions">{row.status === "PENDING" && <><button className="button gold compact" disabled={Boolean(busy)} onClick={() => act(`pa-${row.id}`, `/api/admin/payment-proofs/${row.id}/decision`, { decision: "APPROVE" })}>确认入账</button><button className="button danger compact" disabled={Boolean(busy)} onClick={() => act(`pr-${row.id}`, `/api/admin/payment-proofs/${row.id}/decision`, { decision: "REJECT", note: "付款资料无法核实" })}>拒绝</button></>}</td></tr>)}</tbody></table></div>}

    {tab === "withdrawals" && <div className="panel table-wrap"><table className="data-table"><thead><tr><th>用户</th><th>账户</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>{data.withdrawals.map((row) => <tr key={row.id}><td>{row.user.name}<br/><span className="muted">{row.user.phone}</span></td><td>{row.account}</td><td className="price">RM {row.amount}</td><td><span className="status">{row.status}</span></td><td className="actions">{row.status === "PENDING" && <><button className="button gold compact" disabled={Boolean(busy)} onClick={() => act(`wa-${row.id}`, `/api/admin/withdrawals/${row.id}/decision`, { decision: "APPROVE", note: "Transfer completed" })}>标记已付款</button><button className="button danger compact" disabled={Boolean(busy)} onClick={() => act(`wr-${row.id}`, `/api/admin/withdrawals/${row.id}/decision`, { decision: "REJECT", note: "Payout details require correction" })}>拒绝并释放</button></>}</td></tr>)}</tbody></table></div>}

    {tab === "disputes" && <div className="panel table-wrap"><table className="data-table"><thead><tr><th>订单</th><th>双方</th><th>原因</th><th>状态</th><th>裁决</th></tr></thead><tbody>{data.disputes.map((row) => <tr key={row.id}><td>{row.order.listing.title}<br/><span className="muted">{row.order.id}</span></td><td>买：{row.order.buyer.name}<br/>卖：{row.order.seller.name}</td><td>{row.reason}</td><td><span className="status bad">{row.status}</span></td><td className="actions">{["OPEN", "REVIEWING"].includes(row.status) && <><button className="button compact" disabled={Boolean(busy)} onClick={() => act(`db-${row.id}`, `/api/admin/disputes/${row.id}/resolve`, { resolution: "BUYER", note: "Evidence reviewed; refund buyer" })}>退款买家</button><button className="button gold compact" disabled={Boolean(busy)} onClick={() => act(`ds-${row.id}`, `/api/admin/disputes/${row.id}/resolve`, { resolution: "SELLER", note: "Evidence reviewed; release seller" })}>放款卖家</button></>}</td></tr>)}</tbody></table></div>}
  </>;
}
