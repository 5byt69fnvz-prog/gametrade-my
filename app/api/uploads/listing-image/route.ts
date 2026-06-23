import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { listingImageUploadSchema } from "@/lib/validators";
import { createListingImageUpload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const input = await parseJson(request, listingImageUploadSchema);
    return jsonOk(await createListingImageUpload(user.id, input.contentType));
  } catch (error) {
    return apiError(error);
  }
}
