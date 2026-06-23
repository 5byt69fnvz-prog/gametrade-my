import { jsonOk } from "@/lib/http";
import { currentUser } from "@/lib/session";

export async function GET() {
  const user = await currentUser();
  return jsonOk({ user: user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    primaryVerification: user.primaryVerification,
    sellerProfile: user.sellerProfile
  } : null });
}
