"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export type GameCardData = {
  slug: string;
  name: string;
  posterUrl: string | null;
  platform: string | null;
  regionLabel: string | null;
  shortDescription?: string | null;
  heat: number;
  isService?: boolean;
  startingPrice?: string | null;
  _count?: { listings: number };
};

export function GameCard({ game, featured = false }: { game: GameCardData; featured?: boolean }) {
  const { t } = useLocale();
  return <Link className={featured ? "game-card featured" : "game-card"} href={`/games/${game.slug}`}>
    <div className="game-art">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={game.posterUrl || "/assets/category-mobile.png"} alt={game.name} />
      <span className="region-pill">{game.isService ? "DIGITAL" : game.regionLabel || "GLOBAL"}</span>
    </div>
    <div className="game-card-body">
      <div><h3>{game.name}</h3><p>{game.shortDescription || `${game.platform} · ${game.regionLabel}`}</p></div>
      <div className="game-meta">
        <span><strong>{game._count?.listings || 0}</strong> {t("listings")}</span>
        <span>{game.startingPrice ? <><strong>RM {game.startingPrice}</strong> {t("from")}</> : <>热度 <strong>{game.heat.toLocaleString()}</strong></>}</span>
      </div>
    </div>
  </Link>;
}
