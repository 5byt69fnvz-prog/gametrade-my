import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/session";
import { createPrivateDownload } from "@/lib/storage";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const proof = await db.paymentProof.findUnique({ where: { id }, select: { fileKey: true } });
    if (!proof?.fileKey) throw new Error("NOT_FOUND");
    return Response.redirect(await createPrivateDownload(proof.fileKey), 302);
  } catch (error) {
    return apiError(error);
  }
}
