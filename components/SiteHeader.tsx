"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Locale, useLocale } from "@/components/LocaleProvider";

type HeaderUser = { id: string; name: string; role: string; emailVerified: boolean } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [["/", t("home")], ["/games", t("games")], ["/sell", t("sell")], ["/orders", t("orders")], ["/wallet", t("wallet")]];
  if (user?.role === "ADMIN") links.push(["/admin", t("admin")]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return <>
    <div className="utility-header"><div><span>GameTrade MY · Malaysia</span><span className="utility-status">系统正常</span></div><div><Link href="/terms">交易规则</Link><Link href="/privacy">隐私与 PDPA</Link><span>客服中心</span></div></div>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="GameTrade MY home">
        <span className="brand-mark">GT</span>
        <span><strong>GameTrade MY</strong><small>Malaysia game marketplace</small></span>
      </Link>
      <form className="header-search" action="/games"><input name="q" aria-label="搜索游戏、商品或卖家" placeholder="搜索游戏、商品或卖家"/><button type="submit">搜索</button></form>
      <button className="menu-button" type="button" aria-label="打开菜单" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>菜单</button>
      <nav className={menuOpen ? "main-nav open" : "main-nav"}>
        {links.map(([href, label]) => <Link key={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <select aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
          <option value="zh">中文</option><option value="en">EN</option><option value="ms">BM</option>
        </select>
        {user ? <div className="account-menu">
          <Link href={user.emailVerified ? "/profile" : "/verify"} className="account-chip">
            <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <span>{user.name}<small>{user.emailVerified ? t("verified") : t("unverified")}</small></span>
          </Link>
          <button className="logout-button" type="button" onClick={logout}>{t("logout")}</button>
        </div> : <Link className="button primary compact" href="/auth">{t("loginRegister")}</Link>}
      </div>
    </header>
    <div className="trust-bar"><span>平台订单留痕</span><span>Email OTP</span><span>DuitNow 优先</span><span>纠纷证据中心</span></div>
  </>;
}
