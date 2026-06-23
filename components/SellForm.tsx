"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

type GameOption = { id: string; name: string; selectionMode: string; variants: { id: string; label: string }[]; productTypes: { code: string; labelZh: string; riskStatus: string }[] };

export function SellForm({ games, initialGame }: { games: GameOption[]; initialGame?: string }) {
  const router = useRouter();
  const [gameId, setGameId] = useState(initialGame && games.some((item) => item.id === initialGame) ? initialGame : games[0]?.id || "");
  const [type, setType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const game = useMemo(() => games.find((item) => item.id === gameId) || games[0], [gameId, games]);
  const product = game?.productTypes.find((item) => item.code === type) || game?.productTypes[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api("/api/listings", { method: "POST", body: JSON.stringify({ ...raw, tags: String(raw.tags || "").split(",").map((value) => value.trim()).filter(Boolean), termsRiskAcknowledged: raw.termsRiskAcknowledged === "on" }) });
      setSuccess("商品已进入管理员审核队列。审核通过后会显示在对应游戏市场。");
      event.currentTarget.reset(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "发布失败"); } finally { setBusy(false); }
  }

  return <form className="panel seller-form" onSubmit={submit}>
    <div className="form-section"><div className="form-section-title"><span>1</span><div><strong>选择市场</strong><p>游戏和区服会决定商品出现在哪里。</p></div></div><div className="form-grid"><div className="field"><label>游戏</label><select className="select" name="gameId" value={gameId} onChange={(event) => { setGameId(event.target.value); setType(""); }} required>{games.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>{game?.selectionMode !== "NONE" && <div className="field"><label>区服 / 平台</label><select className="select" name="gameVariantId" required defaultValue=""><option value="" disabled>请选择兼容区服</option>{game.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.label}</option>)}</select></div>}<div className="field"><label>商品类型</label><select className="select" name="type" value={product?.code || ""} onChange={(event) => setType(event.target.value)} required>{game?.productTypes.map((item) => <option value={item.code} key={item.code}>{item.labelZh}{item.riskStatus === "REVIEW_REQUIRED" ? " · 需审核" : ""}</option>)}</select></div></div></div>
    <div className="form-section"><div className="form-section-title"><span>2</span><div><strong>商品资料</strong><p>用买家能快速比较的方式描述交付内容。</p></div></div><div className="form-grid"><div className="field wide"><label>商品标题</label><input className="input" name="title" required minLength={5} maxLength={160} placeholder="例：亚洲服成品号，Email 可换绑，30 分钟内交付"/></div><div className="field wide"><label>详细说明</label><textarea className="textarea" name="description" required minLength={20} placeholder="说明内容、服务器、账号绑定状态、交付步骤和售后范围。"/></div><div className="field"><label>价格 (RM)</label><input className="input" name="price" type="number" min="0.01" max="100000" step="0.01" required/></div><div className="field"><label>库存</label><input className="input" name="stock" type="number" min="1" max="10000" defaultValue="1" required/></div><div className="field"><label>预计交付</label><select className="select" name="deliveryMins" defaultValue="30"><option value="15">15 分钟</option><option value="30">30 分钟</option><option value="60">1 小时</option><option value="360">6 小时</option><option value="1440">24 小时</option></select></div><div className="field"><label>店铺名称（首次发布）</label><input className="input" name="shopName" maxLength={80}/></div><div className="field wide"><label>标签（逗号分隔）</label><input className="input" name="tags" placeholder="快速交付, 可改资料, 原号主"/></div></div></div>
    {product?.riskStatus === "REVIEW_REQUIRED" && <label className="risk-consent"><input type="checkbox" name="termsRiskAcknowledged" required/><span><strong>账号类商品风险确认</strong>我理解账号转售可能受到发行商条款限制，并同意平台进行人工审核。不得发布盗号、来源不明或无法验证归属的账号。</span></label>}
    {error && <p className="form-error">{error}</p>}{success && <p className="form-success">{success}</p>}
    <div className="form-submit"><span>提交后不会立即公开，管理员审核通过后才会上架。</span><button className="button primary" disabled={busy}>{busy ? "提交中..." : "提交商品审核"}</button></div>
  </form>;
}
