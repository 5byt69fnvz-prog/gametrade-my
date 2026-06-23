import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { AuthForms } from "@/components/AuthForms";

export default async function AuthPage() {
  if (await currentUser()) redirect("/");
  return <div className="auth-shell"><div className="auth-art">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/game-posters/valorant-mobile-ai.jpg" alt="GameTrade MY"/><div className="auth-art-copy"><p className="eyebrow">ONE ACCOUNT, EVERY ORDER</p><h1>每一次交易，都回到你的账号。</h1><p>订单、付款凭证、交付资料、聊天和申诉记录集中保存，Email 验证后即可开始买卖。</p><div className="auth-trust"><span>✓ Email OTP</span><span>✓ 平台内交付</span><span>✓ RM 本地结账</span></div></div></div><div className="auth-card"><AuthForms/></div></div>;
}
