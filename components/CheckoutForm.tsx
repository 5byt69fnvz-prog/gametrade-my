"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

const methods = [
  { id: "DUITNOW_QR", mark: "DN", label: "DuitNow QR", note: "推荐 · 扫码付款", tone: "duitnow" },
  { id: "FPX", mark: "FPX", label: "FPX Online Banking", note: "马来西亚网上银行", tone: "fpx" },
  { id: "BANK_TRANSFER", mark: "MY", label: "银行转账", note: "Maybank / CIMB / PBB / RHB", tone: "bank" },
  { id: "TNG_EWALLET", mark: "T", label: "TNG eWallet", note: "电子钱包", tone: "tng" },
  { id: "GRABPAY", mark: "G", label: "GrabPay", note: "电子钱包", tone: "grab" },
  { id: "BOOST", mark: "B", label: "Boost", note: "电子钱包", tone: "boost" }
];

export function CheckoutForm({ listingId, price, authenticated, verified, compatibility }: { listingId: string; price: string; authenticated: boolean; verified: boolean; compatibility?: string | null }) {
  const router = useRouter(); const [method, setMethod] = useState("DUITNOW_QR"); const [confirmed, setConfirmed] = useState(!compatibility); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!authenticated) { router.push("/auth"); return; } if (!verified) { router.push("/verify"); return; } if (!confirmed) { setError("请先确认平台与区服兼容性。"); return; } setBusy(true); setError(""); try { const order = await api<{ id: string }>("/api/orders", { method: "POST", body: JSON.stringify({ listingId, paymentMethod: method, clientRequestId: crypto.randomUUID() }) }); router.push(`/orders/${order.id}`); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "下单失败"); setBusy(false); } }
  return <form className="checkout" onSubmit={submit}><div className="checkout-total"><span>订单金额</span><strong>RM {price}</strong><small>管理员确认付款后才通知卖家交付</small></div>{compatibility && <label className="compat-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>我已确认区服</strong>{compatibility}</span></label>}<div className="field"><label>MY 快速结账</label><div className="payment-grid">{methods.map((item) => <button type="button" aria-pressed={method === item.id} className={method === item.id ? "payment-method active" : "payment-method"} key={item.id} onClick={() => setMethod(item.id)}><span className={`payment-mark ${item.tone}`}>{item.mark}</span><span><strong>{item.label}</strong><small>{item.note}</small></span><b>{method === item.id ? "已选" : ""}</b></button>)}</div></div><div className="checkout-note"><span>i</span><p>这是付款界面预览。当前不会自动扣款；建立订单后需按照订单页资料付款并上传凭证。</p></div>{error && <p className="form-error">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? "建立订单中..." : authenticated ? verified ? "确认下单" : "验证 Email 后下单" : "登录后继续"}</button><p className="checkout-terms">付款前可再次查看订单和区服资料。平台不会要求你直接转账给卖家。</p></form>;
}
