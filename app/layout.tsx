import type { Metadata } from "next";
import "./globals.css";
import { currentUser } from "@/lib/session";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: { default: "GameTrade MY", template: "%s | GameTrade MY" },
  description: "Malaysia-first game account, currency, item and top-up marketplace.",
  metadataBase: new URL(process.env.APP_URL || "http://127.0.0.1:4173")
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  const safeUser = user ? { id: user.id, name: user.name, role: user.role, emailVerified: user.emailVerified } : null;
  return <html lang="zh-Hans"><body><LocaleProvider><SiteHeader user={safeUser} /><main>{children}</main><footer className="site-footer"><div><strong>GameTrade MY</strong><span>马来西亚游戏虚拟物品交易平台</span></div><nav><a href="/terms">交易条款</a><a href="/privacy">隐私与 PDPA</a><a href="/games">游戏市场</a></nav><span>© {new Date().getFullYear()} GameTrade MY</span></footer></LocaleProvider></body></html>;
}
