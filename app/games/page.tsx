import Link from "next/link";
import { db } from "@/lib/db";
import { GameCard } from "@/components/GameCard";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const [games, categories, priceRows] = await Promise.all([
    db.game.findMany({ where: { active: true, ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}), ...(params.category ? { category: { slug: params.category } } : {}) }, include: { category: true, _count: { select: { listings: { where: { status: "ACTIVE" } } } } }, orderBy: [{ isService: "asc" }, { heat: "desc" }, { name: "asc" }] }),
    db.gameCategory.findMany({ orderBy: { nameEn: "asc" } }),
    db.listing.groupBy({ by: ["gameId"], where: { status: "ACTIVE", stock: { gt: 0 } }, _min: { price: true } })
  ]);
  const prices = new Map(priceRows.map((row) => [row.gameId, row._min.price?.toFixed(2) || null]));
  const regularGames = games.filter((game) => !game.isService);
  const services = games.filter((game) => game.isService);
  return <div className="container">
    <div className="page-title"><div><p className="eyebrow">GAME DIRECTORY</p><h1>游戏市场</h1><p>先选择游戏，再由区服向导筛出真正兼容的商品。</p></div><span className="count-badge">{games.length} 个市场</span></div>
    <form className="directory-search"><div className="search-field"><span>⌕</span><input name="q" defaultValue={params.q} placeholder="搜索游戏或充值服务"/></div><select name="category" defaultValue={params.category || ""}><option value="">全部分类</option>{categories.map(category => <option key={category.id} value={category.slug}>{category.nameZh}</option>)}</select><button className="button primary">筛选</button>{(params.q || params.category) && <Link className="button secondary" href="/games">清除</Link>}</form>
    <div className="filter-pills"><Link className={!params.category ? "active" : ""} href="/games">全部</Link>{categories.map(category => <Link className={params.category === category.slug ? "active" : ""} key={category.id} href={`/games?category=${category.slug}`}>{category.nameZh}</Link>)}</div>
    {regularGames.length ? <div className="game-grid directory-grid">{regularGames.map(game => <GameCard key={game.id} game={{ ...game, startingPrice: prices.get(game.id) }}/>)}</div> : services.length === 0 ? <div className="empty">找不到符合条件的游戏。</div> : null}
    {services.length > 0 && <section className="section-block"><div className="section-head"><div><p className="eyebrow">TOP-UP & DIGITAL</p><h2>充值与数字服务</h2><p>点数卡、钱包码和订阅服务独立展示，不与游戏账号市场混在一起。</p></div></div><div className="game-grid directory-grid">{services.map(game => <GameCard key={game.id} game={{ ...game, startingPrice: prices.get(game.id) }}/>)}</div></section>}
  </div>;
}
