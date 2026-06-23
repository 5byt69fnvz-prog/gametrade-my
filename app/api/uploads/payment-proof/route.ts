import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk, parseJson } from "@/lib/http";
import { requireVerifiedUser } from "@/lib/session";
import { uploadSchema } from "@/lib/validators";
import { createPaymentProofUpload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireVerifiedUser();
    const input = await parseJson(request, uploadSchema);
    return jsonOk(await createPaymentProofUpload(user.id, input.contentType));
  } catch (error) {
    return apiError(error);
  }
}
