import Link from "next/link";
import { db } from "@/lib/db";

const categories = [
  { code: "手游", label: "手机游戏", slug: "mobile-games", note: "MOBA、射击与开放世界" },
  { code: "PC", label: "PC 在线游戏", slug: "pc-online", note: "账号、点券与陪练" },
  { code: "ST", label: "Steam 市场", slug: "steam-games", note: "钱包、饰品与游戏服务" },
  { code: "充", label: "充值与点卡", slug: "point-cards", note: "马来西亚本地充值" },
  { code: "海", label: "海外充值", slug: "overseas-recharge", note: "跨区充值与数字服务" }
];

const typeLabels: Record<string, string> = {
  ACCOUNT: "账号", CURRENCY: "游戏币", ITEM: "道具", TOPUP: "代储",
  BOOSTING: "代练", GIFT: "送礼", GIFT_CARD: "点数卡", SUBSCRIPTION: "订阅", REQUEST: "收购"
};

const statusLabels: Record<string, string> = {
  PAYMENT_REVIEW: "付款审核", AWAITING_DELIVERY: "等待交付", DELIVERED: "等待验收", COMPLETED: "已完成"
};

function shortTime(date: Date) {
  return new Intl.DateTimeFormat("zh-MY", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default async function HomePage() {
  const [games, priceRows, listingCount, completedCount, recentListings, recentOrders, topSellers] = await Promise.all([
    db.game.findMany({
      where: { active: true, isService: false },
      include: { _count: { select: { listings: { where: { status: "ACTIVE" } } } } },
      orderBy: { heat: "desc" },
      take: 9
    }),
    db.listing.groupBy({ by: ["gameId"], where: { status: "ACTIVE", stock: { gt: 0 } }, _min: { price: true } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.order.count({ where: { status: "COMPLETED" } }),
    db.listing.findMany({
      where: { status: "ACTIVE", stock: { gt: 0 } },
      include: { game: true, gameVariant: true, seller: { include: { sellerProfile: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    db.order.findMany({
      where: { status: { in: ["PAYMENT_REVIEW", "AWAITING_DELIVERY", "DELIVERED", "COMPLETED"] } },
      include: { listing: { include: { game: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.sellerProfile.findMany({ include: { user: true }, orderBy: { completedOrders: "desc" }, take: 4 })
  ]);

  const prices = new Map(priceRows.map((row) => [row.gameId, row._min.price?.toFixed(2) || null]));

  return <div className="marketplace-home">
    <div className="marketplace-frame">
      <div className="marketplace-heading">
        <div><span className="live-dot"/>马来西亚游戏交易市场</div>
        <div className="heading-stats"><span><b>{listingCount}</b> 在售商品</span><span><b>{completedCount}</b> 完成订单</span><span><b>RM</b> 本地计价</span></div>
      </div>

      <div className="marketplace-layout">
        <aside className="marketplace-sidebar">
          <div className="sidebar-title"><strong>市场分类</strong><Link href="/games">全部游戏</Link></div>
          <nav className="category-nav" aria-label="游戏分类">
            {categories.map((item) => <Link href={`/games?category=${item.slug}`} key={item.slug}>
              <span>{item.code}</span><div><strong>{item.label}</strong><small>{item.note}</small></div><b>›</b>
            </Link>)}
          </nav>
          <div className="sidebar-divider"/>
          <div className="sidebar-safety">
            <strong>平台交易保障</strong>
            <p>付款确认后才通知卖家交付，订单内保留聊天与证据。</p>
            <ul><li>Email 验证卖家</li><li>区服兼容确认</li><li>纠纷人工处理</li></ul>
            <Link href="/terms">查看交易规则 →</Link>
          </div>
        </aside>

        <main className="marketplace-main">
          <section className="market-search-panel">
            <div><h1>今天想交易什么？</h1><p>先选择正确的游戏、平台和服务器，再查看兼容商品。</p></div>
            <form action="/games" className="marketplace-search"><span aria-hidden="true">⌕</span><input name="q" aria-label="搜索游戏或商品" placeholder="搜索原神、王者荣耀、VALORANT..."/><button>搜索</button></form>
            <div className="quick-search"><span>热门：</span><Link href="/games/honor-of-kings">王者荣耀</Link><Link href="/games/genshin-impact">原神</Link><Link href="/games/mobile-legends">MLBB</Link><Link href="/games/valorant">VALORANT</Link></div>
          </section>

          <section className="market-section">
            <div className="market-section-head"><div><h2>热门游戏市场</h2><p>每款游戏只显示一次，进入后选择区服。</p></div><Link href="/games">查看全部</Link></div>
            <div className="compact-game-grid">{games.map((game) => <Link className="compact-game-card" href={`/games/${game.slug}`} key={game.id}>
              <div className="compact-game-art">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={game.posterUrl || "/assets/category-mobile.png"} alt={game.name}/><span>{game.regionLabel || "Global"}</span></div>
              <div className="compact-game-copy"><h3>{game.name}</h3><p>{game.shortDescription || `${game.platform || "多平台"} 游戏交易市场`}</p><div><span>{game._count.listings} 件商品</span>{prices.get(game.id) ? <strong>RM {prices.get(game.id)} 起</strong> : <strong>等待首卖</strong>}</div></div>
            </Link>)}</div>
          </section>

          <section className="market-section recent-listings">
            <div className="market-section-head"><div><h2>最新上架</h2><p>经过平台审核、仍有库存的商品。</p></div><Link href="/games">浏览市场</Link></div>
            <div className="listing-table">
              {recentListings.map((listing) => <Link href={`/listing/${listing.id}`} className="listing-table-row" key={listing.id}>
                <span className="listing-game-thumb">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={listing.game.posterUrl || "/assets/category-mobile.png"} alt=""/></span>
                <span><strong>{listing.title}</strong><small>{listing.game.name} · {listing.gameVariant?.label || listing.game.regionLabel || "通用"}</small></span>
                <span className="table-type">{typeLabels[listing.type] || listing.type}</span>
                <span className="table-seller">{listing.seller.sellerProfile?.shopName || listing.seller.name}<small>Email 已验证</small></span>
                <b>RM {listing.price.toFixed(2)}</b>
              </Link>)}
            </div>
          </section>
        </main>

        <aside className="marketplace-rail">
          <section className="rail-panel">
            <div className="rail-title"><strong>实时成交</strong><span>LIVE</span></div>
            <div className="deal-feed">{recentOrders.length ? recentOrders.map((order) => <div key={order.id}><span className="deal-game">{order.listing.game.name.slice(0, 1)}</span><div><strong>{order.listing.game.name}</strong><small>{statusLabels[order.status] || order.status} · {shortTime(order.createdAt)}</small></div><b>RM {order.amount.toFixed(2)}</b></div>) : <div className="empty-feed">新订单会实时显示在这里。</div>}</div>
          </section>

          <section className="rail-panel seller-rank">
            <div className="rail-title"><strong>本周卖家信誉</strong><Link href="/games">市场</Link></div>
            {topSellers.length ? topSellers.map((seller, index) => <div className="seller-rank-row" key={seller.id}><span>{index + 1}</span><div><strong>{seller.shopName}</strong><small>{seller.completedOrders} 笔成交 · {Number(seller.onTimeRate).toFixed(0)}% 准时</small></div><b>{Number(seller.rating).toFixed(1)}</b></div>) : <p className="empty-feed">卖家数据累积中。</p>}
          </section>

          <section className="rail-panel start-selling">
            <span className="rail-kicker">卖家入口</span><h3>把闲置游戏资产变成余额</h3><p>选择游戏与区服，填写交付说明，平台审核后上架。</p><Link className="button primary full" href="/sell">发布商品</Link>
          </section>

          <section className="payment-familiarity"><span>MY 付款方式</span><div><b className="pay-dn">DN</b><b className="pay-fpx">FPX</b><b className="pay-tng">TNG</b><b className="pay-grab">G</b><b className="pay-boost">B</b></div></section>
        </aside>
      </div>
    </div>
  </div>;
}
