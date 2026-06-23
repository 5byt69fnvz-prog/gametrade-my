"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "zh" | "en" | "ms";

const copy = {
  zh: {
    home: "首页", games: "游戏", sell: "出售", orders: "订单", wallet: "钱包", profile: "资料", admin: "后台",
    loginRegister: "登录 / 注册", logout: "退出", search: "搜索游戏或区服", explore: "浏览游戏", sellNow: "发布商品",
    heroTitle: "马来西亚玩家的安全游戏交易平台", heroText: "账号、游戏币、道具、代储与点数卡，一站式平台托管交易。",
    verified: "已验证", unverified: "待验证", listings: "商品", heat: "热度", from: "起", buy: "立即购买",
    login: "登录", register: "注册", verify: "验证 OTP", submit: "提交", loading: "处理中...", amount: "金额", status: "状态"
  },
  en: {
    home: "Home", games: "Games", sell: "Sell", orders: "Orders", wallet: "Wallet", profile: "Profile", admin: "Admin",
    loginRegister: "Sign in / Register", logout: "Sign out", search: "Search games or regions", explore: "Explore games", sellNow: "Create listing",
    heroTitle: "Secure game trading for Malaysian players", heroText: "Accounts, currency, items, top-ups and point cards with platform-managed transactions.",
    verified: "Verified", unverified: "Verify now", listings: "Listings", heat: "Popularity", from: "From", buy: "Buy now",
    login: "Sign in", register: "Register", verify: "Verify OTP", submit: "Submit", loading: "Processing...", amount: "Amount", status: "Status"
  },
  ms: {
    home: "Utama", games: "Permainan", sell: "Jual", orders: "Pesanan", wallet: "Dompet", profile: "Profil", admin: "Admin",
    loginRegister: "Log masuk / Daftar", logout: "Log keluar", search: "Cari permainan atau rantau", explore: "Lihat permainan", sellNow: "Cipta iklan",
    heroTitle: "Dagangan permainan selamat untuk pemain Malaysia", heroText: "Akaun, mata wang, item, tambah nilai dan kad mata dengan transaksi terurus.",
    verified: "Disahkan", unverified: "Sahkan sekarang", listings: "Iklan", heat: "Populariti", from: "Dari", buy: "Beli sekarang",
    login: "Log masuk", register: "Daftar", verify: "Sahkan OTP", submit: "Hantar", loading: "Memproses...", amount: "Jumlah", status: "Status"
  }
} as const;

type CopyKey = keyof typeof copy.zh;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: CopyKey) => string }>({ locale: "zh", setLocale: () => undefined, t: (key) => copy.zh[key] });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  useEffect(() => {
    const saved = window.localStorage.getItem("gametrade_locale") as Locale | null;
    if (saved && copy[saved]) setLocaleState(saved);
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("gametrade_locale", next);
  };
  const value = useMemo(() => ({ locale, setLocale, t: (key: CopyKey) => copy[locale][key] }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
