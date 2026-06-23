"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await api(tab === "register" ? "/api/auth/register" : "/api/auth/login", { method: "POST", body: JSON.stringify(values) }); router.push(tab === "register" ? "/verify" : "/"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "提交失败"); } finally { setBusy(false); }
  }
  return <div className="auth-panel"><div className="auth-tabs"><button type="button" className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>登录</button><button type="button" className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>创建账号</button></div>
    <div className="auth-heading"><h1>{tab === "login" ? "欢迎回来" : "加入 GameTrade MY"}</h1><p>{tab === "login" ? "登录后继续查看订单、钱包与卖家中心。" : "验证 Email 后即可购买、发布商品和申请提款。"}</p></div>
    <form className="form-grid" onSubmit={submit}>
      {tab === "register" ? <><div className="field wide"><label>姓名</label><input className="input" name="name" required minLength={2} autoComplete="name" placeholder="你的称呼"/></div><div className="field wide"><label>Email</label><input className="input" name="email" type="email" required autoComplete="email" placeholder="name@example.com"/></div><div className="field wide"><label>马来西亚手机号 <span className="optional">选填</span></label><input className="input" name="phone" placeholder="+60123456789" autoComplete="tel"/></div></> : <div className="field wide"><label>Email 或已登记手机号</label><input className="input" name="loginId" required autoComplete="username" placeholder="name@example.com"/></div>}
      <div className="field wide"><label>密码</label><input className="input" name="password" type="password" required minLength={tab === "register" ? 10 : 1} autoComplete={tab === "register" ? "new-password" : "current-password"} placeholder="••••••••••"/>{tab === "register" && <small className="muted">至少 10 个字符，并包含英文字母和数字。</small>}</div>
      {error && <p className="form-error field wide">{error}</p>}
      <div className="field wide"><button className="button primary full" disabled={busy}>{busy ? "处理中..." : tab === "register" ? "注册并发送 Email OTP" : "登录账号"}</button></div>
    </form><p className="auth-foot">登录即表示你同意交易条款与隐私政策。平台不会通过聊天要求你私下付款。</p>
  </div>;
}
