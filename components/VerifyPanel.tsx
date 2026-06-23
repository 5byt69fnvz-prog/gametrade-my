"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function VerifyPanel({ emailVerified, email }: { emailVerified: boolean; email: string }) {
  const router = useRouter(); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { const code = sessionStorage.getItem("gametrade-demo-otp"); if (code) { setMessage(`预览模式验证码：${code}`); sessionStorage.removeItem("gametrade-demo-otp"); } }, []);
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const code = new FormData(event.currentTarget).get("code"); try { await api("/api/otp/verify", { method: "POST", body: JSON.stringify({ channel: "EMAIL", purpose: "REGISTRATION", code }) }); setMessage("Email 验证成功，账号现在可以进行交易。"); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "验证失败"); } finally { setBusy(false); } }
  async function resend() { setBusy(true); setError(""); try { const result = await api<{ demoCode?: string }>("/api/otp/send", { method: "POST", body: JSON.stringify({ channel: "EMAIL", purpose: "REGISTRATION" }) }); setMessage(result.demoCode ? `预览模式验证码：${result.demoCode}` : "新的验证码已发送，请检查收件箱和垃圾邮件。60 秒后可再次发送。"); } catch (cause) { setError(cause instanceof Error ? cause.message : "发送失败"); } finally { setBusy(false); } }
  return <div className="verify-card"><div className="mail-mark">@</div><h2>{emailVerified ? "Email 已验证" : "验证你的 Email"}</h2><p>验证码已发送至 <strong>{email}</strong>。验证码 10 分钟有效，最多尝试 5 次。</p>{emailVerified ? <div className="verified-success"><span>✓</span><div><strong>账号可以交易</strong><p>你现在可以下单、发布商品和申请提款。</p></div></div> : <form className="otp-form" onSubmit={verify}><label>6 位验证码</label><input className="input otp-code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoFocus/><button className="button primary full" disabled={busy}>验证 Email</button><button className="text-button" type="button" disabled={busy} onClick={resend}>没有收到？重新发送</button></form>}{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}</div>;
}
