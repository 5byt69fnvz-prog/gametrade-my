import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { VerifyPanel } from "@/components/VerifyPanel";

export default async function VerifyPage() {
  let user; try { user = await requireUser(); } catch { redirect("/auth"); }
  return <div className="verify-shell"><VerifyPanel emailVerified={user.emailVerified} email={user.email}/><aside><p className="eyebrow">WHY VERIFY</p><h1>先确认联系方式，再进入交易。</h1><p>Email OTP 可以减少冒用账号和无效注册，并让管理员在订单发生问题时找到正确客户记录。</p><ul className="check-list"><li>验证码 10 分钟后自动失效</li><li>连续错误最多尝试 5 次</li><li>60 秒重发冷却</li><li>平台不会索取你的密码</li></ul></aside></div>;
}
