import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GameMarket } from "@/components/GameMarket";

const legacyRedirects: Record<string, [string, string]> = {
  "honor-kings-ios-wechat": ["honor-of-kings", "ios-wechat"], "honor-kings-ios-qq": ["honor-of-kings", "ios-qq"],
  "honor-kings-android-wechat": ["honor-of-kings", "android-wechat"], "honor-kings-android-qq": ["honor-of-kings", "android-qq"],
  "peace-elite-ios-wechat": ["peace-elite", "ios-wechat"], "peace-elite-ios-qq": ["peace-elite", "ios-qq"],
  "peace-elite-android-wechat": ["peace-elite", "android-wechat"], "peace-elite-android-qq": ["peace-elite", "android-qq"]
};

export default async function GamePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string }> }) {
  const { slug } = await params;
  if (legacyRedirects[slug]) redirect(`/games/${legacyRedirects[slug][0]}?variant=${legacyRedirects[slug][1]}`);
  const [game, query] = await Promise.all([db.game.findUnique({ where: { slug }, include: {
    category: true,
    variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    productTypes: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    listings: { where: { status: "ACTIVE", stock: { gt: 0 } }, include: { gameVariant: true, seller: { select: { name: true, emailVerified: true, sellerProfile: true } } }, orderBy: { createdAt: "desc" } }
  } }), searchParams]);
  if (!game || !game.active) notFound();
  const prices = game.listings.map((item) => Number(item.price)).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)].toFixed(2) : null;
  const serializedListings = game.listings.map((listing) => ({ ...listing, price: listing.price.toFixed(2), seller: { ...listing.seller, sellerProfile: listing.seller.sellerProfile ? { ...listing.seller.sellerProfile, rating: listing.seller.sellerProfile.rating.toFixed(2), guaranteeDeposit: listing.seller.sellerProfile.guaranteeDeposit.toFixed(2), onTimeRate: listing.seller.sellerProfile.onTimeRate.toFixed(2), disputeRate: listing.seller.sellerProfile.disputeRate.toFixed(2), createdAt: listing.seller.sellerProfile.createdAt.toISOString(), updatedAt: listing.seller.sellerProfile.updatedAt.toISOString() } : null }, createdAt: listing.createdAt.toISOString(), updatedAt: listing.updatedAt.toISOString(), reviewedAt: listing.reviewedAt?.toISOString() || null }));
  return <><div className="poster-banner game-banner">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={game.posterUrl || "/assets/category-mobile.png"} alt={game.name}/><div className="poster-shade"/></div><div className="container game-market"><GameMarket game={{ id: game.id, name: game.name, platform: game.platform, regionLabel: game.regionLabel, selectionMode: game.selectionMode, shortDescription: game.shortDescription, heat: game.heat }} variants={game.variants} productTypes={game.productTypes} listings={serializedListings} medianPrice={median} initialVariantSlug={query.variant}/></div></>;
}
