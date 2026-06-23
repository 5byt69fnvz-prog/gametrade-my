import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { currentUser } from "@/lib/session";
import { createPrivateDownload } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const image = await db.listingImage.findUnique({
      where: { id },
      include: { listing: { select: { id: true, sellerId: true, status: true } } }
    });
    if (!image) throw new Error("NOT_FOUND");
    const isPublic = image.status === "APPROVED" && image.listing.status === "ACTIVE";
    if (!isPublic) {
      const user = await currentUser();
      if (!user || (user.role !== UserRole.ADMIN && user.id !== image.listing.sellerId)) throw new Error("FORBIDDEN");
    }
    const targetUrl = image.fileUrl || await createPrivateDownload(image.fileKey);
    return Response.redirect(targetUrl, 302);
  } catch (error) {
    return apiError(error);
  }
}
