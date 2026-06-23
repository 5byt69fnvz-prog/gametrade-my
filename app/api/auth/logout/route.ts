import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-error";
import { assertTrustedOrigin, jsonOk } from "@/lib/http";
import { destroySession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await destroySession();
    return jsonOk({ loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
