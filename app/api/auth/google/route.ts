import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/google/oauth";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const rate = rateLimit(`oauth_init_${user.id}`, 10, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    const authUrl = getAuthorizationUrl(user.id);
    return NextResponse.json({ url: authUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate Google OAuth URL" },
      { status: 500 }
    );
  }
}
