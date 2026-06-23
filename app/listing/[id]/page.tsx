import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { CheckoutForm } from "@/components/CheckoutForm";

const typeLabels: Record<string, string> = {
  ACCOUNT: "账号",
  CURRENCY: "游戏币",
  ITEM: "道具",
  TOPUP: "代储/充值",
  BOOSTING: "代练",
  GIFT: "送礼",
  GIFT_CARD: "点数卡",
  SUBSCRIPTION: "订阅",
  REQUEST: "收购需求"
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, user] = await Promise.all([
    db.listing.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        game: { include: { listings: { where: { status: "ACTIVE", stock: { gt: 0 } }, select: { price: true } } } },
        gameVariant: true,
        images: { where: { status: "APPROVED" }, orderBy: { sortOrder: "asc" } },
        seller: {
          include: {
            sellerProfile: true,
            reviewsReceived: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 6 }
          }
        }
      }
    }),
    currentUser()
  ]);
  if (!listing) notFound();

  const prices = listing.game.listings.map((item) => Number(item.price)).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : Number(listing.price);
  const seller = listing.seller.sellerProfile;
  const rating = seller ? Number(seller.rating) : 0;
  const priceDelta = median ? Math.abs((Number(listing.price) / median - 1) * 100).toFixed(0) : "0";

  return <>
    <div className="poster-banner listing-banner">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={listing.game.posterUrl || "/assets/category-mobile.png"} alt={listing.game.name}/><div className="poster-shade"/></div>
    <div className="container listing-page">
      <div className="breadcrumbs"><Link href={`/games/${listing.game.slug}`}>{listing.game.name}</Link><span>/</span><span>{typeLabels[listing.type] || listing.type}</span></div>
      <div className="listing-layout">
        <main className="stack">
          <section className="panel listing-summary">
            <div className="listing-badges"><span className="status good">管理员已审核</span>{listing.riskStatus === "REVIEW_REQUIRED" && <span className="status bad">账号交易风险</span>}<span className="status">库存 {listing.stock}</span></div>
            <h1>{listing.title}</h1>
            <div className="listing-facts"><span><small>游戏</small><strong>{listing.game.name}</strong></span><span><small>版本 / 区服</small><strong>{listing.gameVariant?.label || listing.game.regionLabel || "通用"}</strong></span><span><small>预计交付</small><strong>{listing.deliveryMins} 分钟</strong></span></div>
          </section>

          {listing.riskStatus === "REVIEW_REQUIRED" && <div className="notice coral"><strong>账号类商品提示：</strong>账号转售可能受到游戏发行商条款限制。平台会审核资料与证明图，但无法保证发行商不会限制或封禁转售账号。</div>}

          {listing.images.length > 0 && <section className="panel listing-gallery">
            <div className="panel-title"><h2>卖家证明照片</h2><span>{listing.images.length} 张</span></div>
            <div className="listing-image-grid">{listing.images.map((image) => <a key={image.id} href={`/api/listing-images/${image.id}/file`} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/api/listing-images/${image.id}/file`} alt={image.altText || listing.title}/></a>)}</div>
            <p className="muted gallery-note">图片由卖家上传，平台审核商品时会一并检查；下单前请核对区服、绑定状态和截图内容。</p>
          </section>}

          <section className="panel">
            <div className="panel-title"><h2>商品说明</h2><span>更新于 {new Date(listing.updatedAt).toLocaleDateString("zh-MY")}</span></div>
            <p className="description-copy">{listing.description}</p>
            {listing.tags.length > 0 && <div className="tag-row">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          </section>

          <section className="panel seller-passport">
            <div className="panel-title"><h2>卖家信誉护照</h2><span className="status good">Email 已验证</span></div>
            <div className="seller-identity"><span className="seller-avatar">{(seller?.shopName || listing.seller.name).slice(0, 1)}</span><div><h3>{seller?.shopName || listing.seller.name}</h3><p>{rating ? `${rating.toFixed(1)} 星` : "新卖家"} · 信誉等级 {seller?.trustGrade || "B"}</p></div></div>
            <div className="passport-grid"><span><small>历史成交</small><strong>{seller?.completedOrders || 0}</strong></span><span><small>准时交付率</small><strong>{seller ? `${Number(seller.onTimeRate).toFixed(0)}%` : "--"}</strong></span><span><small>纠纷率</small><strong>{seller ? `${Number(seller.disputeRate).toFixed(1)}%` : "--"}</strong></span><span><small>保证金</small><strong>RM {seller ? Number(seller.guaranteeDeposit).toFixed(0) : "0"}</strong></span><span><small>响应速度</small><strong>约 {seller?.responseMins || 15} 分钟</strong></span><span><small>KYC</small><strong>{listing.seller.realNameVerified ? "已完成" : "Email 等级"}</strong></span></div>
          </section>

          <section className="panel reviews-section">
            <div className="panel-title"><h2>买家评论</h2><span>{listing.seller.reviewsReceived.length} 条近期评论</span></div>
            {listing.seller.reviewsReceived.length ? listing.seller.reviewsReceived.map((review) => <article className="review-item" key={review.id}><div className="review-head"><span className="avatar">{review.reviewer.name.slice(0, 1)}</span><div><strong>{review.reviewer.name}</strong><small>已验证交易 · {new Date(review.createdAt).toLocaleDateString("zh-MY")}</small></div><b>{"★".repeat(review.rating)}</b></div><p>{review.body || "交易顺利，卖家按说明完成交付。"}</p></article>) : <article className="review-item"><div className="review-head"><span className="avatar">G</span><div><strong>平台示例评论</strong><small>已验证交易</small></div><b>★★★★★</b></div><p>区服核对清晰，付款确认后卖家才开始交付。所有资料都保留在订单内。</p><div className="seller-reply"><strong>卖家回复</strong><span>谢谢支持，交付前我们会再次确认服务器。</span></div></article>}
          </section>
        </main>
        <aside className="purchase-side">
          <div className="panel checkout-card"><CheckoutForm listingId={listing.id} price={listing.price.toFixed(2)} authenticated={Boolean(user)} verified={Boolean(user?.emailVerified)} compatibility={listing.gameVariant?.compatibilityNote}/></div>
          <div className="panel price-compare"><div className="panel-title"><span>价格雷达</span><b>{Number(listing.price) <= median ? "低于中位价" : "市场范围内"}</b></div><div><small>同类中位价</small><strong>RM {median.toFixed(2)}</strong></div><p>当前商品比市场中位价 {priceDelta}% {Number(listing.price) <= median ? "低" : "高"}。</p></div>
          <div className="panel"><h3>交易保障</h3><ul className="check-list"><li>付款凭证由管理员确认</li><li>交付与聊天保留完整记录</li><li>买家验收后才进入放款</li><li>可从订单内提交申诉证据</li></ul></div>
        </aside>
      </div>
    </div>
  </>;
}
