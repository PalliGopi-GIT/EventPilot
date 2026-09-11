import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/google/oauth";
import { recordAuditLog } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // User ID passed as state
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/workspace?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/workspace?error=${encodeURIComponent("No authorization code provided by Google")}`
    );
  }

  try {
    const userId = state || "usr_pilot_main";
    const result = await handleOAuthCallback(code, userId);

    await recordAuditLog({
      userId,
      action: "GOOGLE_OAUTH_CONNECT",
      resourceType: "google_connection",
      resourceId: result.connectionId,
      details: { email: result.googleEmail },
    });

    const response = NextResponse.redirect(`${baseUrl}/workspace?google_connected=true`);
    // Set active user cookie
    response.cookies.set("eventpilot_user_id", userId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/workspace?error=${encodeURIComponent(err.message || "Failed to complete Google OAuth")}`
    );
  }
}
