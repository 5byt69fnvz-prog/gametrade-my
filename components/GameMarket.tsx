"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Variant = { id: string; slug: string; label: string; platform: string | null; loginChannel: string | null; regionLabel: string | null; compatibilityNote: string | null };
type ProductType = { code: string; labelZh: string; riskStatus: string };
type Listing = { id: string; title: string; type: string; price: string; deliveryMins: number; gameVariantId: string | null; riskStatus: string; seller: { name: string; emailVerified: boolean; sellerProfile: { shopName: string; rating: string; completedOrders: number; responseMins: number; trustGrade: string } | null } };

const typeFallback: Record<string, string> = { ACCOUNT: "账号", CURRENCY: "游戏币", ITEM: "道具", TOPUP: "代储/充值", BOOSTING: "代练", GIFT: "送礼", GIFT_CARD: "点数卡", SUBSCRIPTION: "订阅", REQUEST: "收购需求" };

export function GameMarket({ game, variants, productTypes, listings, medianPrice, initialVariantSlug }: {
  game: { id: string; name: string; platform: string | null; regionLabel: string | null; selectionMode: string; shortDescription: string | null; heat: number };
  variants: Variant[];
  productTypes: ProductType[];
  listings: Listing[];
  medianPrice: string | null;
  initialVariantSlug?: string;
}) {
  const initialVariant = variants.find((item) => item.id === initialVariantSlug || item.slug === initialVariantSlug);
  const [region, setRegion] = useState(initialVariant?.regionLabel || "");
  const [platform, setPlatform] = useState(initialVariant?.platform || "");
  const [login, setLogin] = useState(initialVariant?.loginChannel || "");
  const [type, setType] = useState("ALL");
  const [subscribed, setSubscribed] = useState(false);
  const requiresVariant = game.selectionMode !== "NONE";
  const regions = [...new Set(variants.map((item) => item.regionLabel).filter(Boolean))] as string[];
  const usesRegionChoice = game.selectionMode === "REGION" || regions.length > 1;
  const variantsForRegion = variants.filter((item) => !usesRegionChoice || !region || item.regionLabel === region);
  const platforms = [...new Set(variantsForRegion.map((item) => item.platform).filter(Boolean))] as string[];
  const variantsForPlatform = variantsForRegion.filter((item) => !platform || item.platform === platform);
  const logins = [...new Set(variantsForPlatform.map((item) => item.loginChannel).filter(Boolean))] as string[];
  const selectedVariant = variants.find((item) => (!usesRegionChoice || !region || item.regionLabel === region) && (!platform || item.platform === platform) && (!login || item.loginChannel === login));
  const needsLogin = game.selectionMode === "PLATFORM_LOGIN" && logins.length > 0;
  const selectionComplete = !requiresVariant || Boolean(selectedVariant && (!usesRegionChoice || region) && (game.selectionMode !== "PLATFORM" || platform) && (game.selectionMode !== "PLATFORM_LOGIN" || (platform && (!needsLogin || login))) && (game.selectionMode !== "REGION" || region));
  const visible = useMemo(() => listings.filter((item) => (!requiresVariant || (selectionComplete && item.gameVariantId === selectedVariant?.id)) && (type === "ALL" || item.type === type)), [listings, requiresVariant, selectionComplete, selectedVariant?.id, type]);
  const floor = visible.length ? Math.min(...visible.map((item) => Number(item.price))).toFixed(2) : null;

  return <>
    <div className="game-market-head"><div><div className="actions"><span className="status good">市场开放</span><span className="status">热度 {game.heat.toLocaleString()}</span></div><h1>{game.name}</h1><p>{game.shortDescription}</p></div><Link className="button primary" href={`/sell?game=${game.id}`}>发布商品</Link></div>

    {requiresVariant && <section className="guide-panel"><div className="guide-title"><span>购买向导</span><strong>先确认账号环境</strong><p>系统只展示与你选择的版本、平台、登录方式或服务器兼容的商品。</p></div><div className="guide-steps">
      {usesRegionChoice && <div className="guide-step"><small>01 · {game.selectionMode === "REGION" ? "服务器地区" : "版本"}</small><div className="choice-row">{regions.map((item) => <button type="button" className={region === item ? "choice active" : "choice"} key={item} onClick={() => { setRegion(item); setPlatform(""); setLogin(""); }}>{item}</button>)}</div></div>}
      {platforms.length > 0 && (!usesRegionChoice || region) && <div className="guide-step"><small>{usesRegionChoice ? "02" : "01"} · 平台</small><div className="choice-row">{platforms.map((item) => <button type="button" className={platform === item ? "choice active" : "choice"} key={item} onClick={() => { setPlatform(item); setLogin(""); }}>{item}</button>)}</div></div>}
      {needsLogin && platform && <div className="guide-step"><small>{usesRegionChoice ? "03" : "02"} · 登录渠道</small><div className="choice-row">{logins.map((item) => <button type="button" className={login === item ? "choice active" : "choice"} key={item} onClick={() => setLogin(item)}>{item}</button>)}</div></div>}
    </div>{selectionComplete && selectedVariant && <div className="compatibility"><strong>已选择：{selectedVariant.label}</strong><span>{selectedVariant.compatibilityNote || "下单前请再次核对版本、平台和区服。"}</span></div>}</section>}

    <div className="market-tabs"><button className={type === "ALL" ? "active" : ""} onClick={() => setType("ALL")}>全部商品</button>{productTypes.map((item) => <button className={type === item.code ? "active" : ""} key={item.code} onClick={() => setType(item.code)}>{item.labelZh}{item.riskStatus === "REVIEW_REQUIRED" ? " · 审核" : ""}</button>)}</div>

    <div className="market-layout"><section className="listing-stack">
      {requiresVariant && !selectionComplete ? <div className="empty guide-empty"><strong>完成上方区服选择</strong><p>选择后才会显示兼容商品，降低买错版本或区服的风险。</p></div> : visible.length ? visible.map((listing) => <Link key={listing.id} href={`/listing/${listing.id}`} className="market-listing"><div><div className="listing-badges"><span>{typeFallback[listing.type] || listing.type}</span>{listing.riskStatus === "REVIEW_REQUIRED" && <span className="risk">账号交易风险提示</span>}</div><h3>{listing.title}</h3><p>{listing.seller.sellerProfile?.shopName || listing.seller.name} · {listing.seller.emailVerified ? "Email 已验证" : "待验证"} · 约 {listing.deliveryMins} 分钟交付</p></div><div className="listing-price"><strong>RM {listing.price}</strong><span>查看详情 →</span></div></Link>) : <div className="empty"><strong>暂无符合条件的商品</strong><p>可以切换商品类型，或成为这个市场的第一位卖家。</p></div>}
    </section><aside className="market-side">
      <div className="panel price-radar"><div className="panel-title"><span>价格雷达</span><b>近 30 天</b></div><div className="radar-price"><small>市场中位价</small><strong>{medianPrice ? `RM ${medianPrice}` : "数据累积中"}</strong><span>{floor ? `当前最低 RM ${floor}` : "等待更多商品"}</span></div><div className="spark-bars" aria-label="价格趋势"><i style={{ height: "48%" }}/><i style={{ height: "56%" }}/><i style={{ height: "44%" }}/><i style={{ height: "68%" }}/><i style={{ height: "60%" }}/><i style={{ height: "74%" }}/><i style={{ height: "66%" }}/></div><button type="button" aria-pressed={subscribed} className={subscribed ? "button primary full" : "button secondary full"} onClick={() => setSubscribed(!subscribed)}>{subscribed ? "已订阅降价提醒" : "订阅降价提醒"}</button></div>
      <div className="panel"><div className="panel-title"><span>市场安全</span><b className="safe-dot">在线</b></div><ul className="check-list"><li>付款确认后才通知卖家</li><li>聊天与证据保留在订单内</li><li>账号类商品需要人工审核</li><li>发生问题可在订单内申诉</li></ul></div>
    </aside></div>

    <section className="market-community"><div><p className="eyebrow">MARKET PULSE</p><h2>买家社区反馈</h2><p>评论会优先展示完成过订单的买家，并允许卖家公开回复。</p></div><div className="review-card"><div className="review-head"><span className="avatar">林</span><div><strong>林先生</strong><small>已验证交易 · 2 天前</small></div><b>★★★★★</b></div><p>区服向导很清楚，下单前能再次确认服务器。卖家按承诺时间完成交付，整个过程都在订单里。</p><div className="seller-reply"><strong>卖家回复</strong><span>谢谢支持，我们会继续在交付前核对区服。</span></div></div></section>
  </>;
}
