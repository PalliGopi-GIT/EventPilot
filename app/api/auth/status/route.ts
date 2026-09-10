import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      googleConnection: user.googleConnection
        ? {
            connected: true,
            email: user.googleConnection.googleEmail,
            connectedAt: user.googleConnection.createdAt,
          }
        : {
            connected: false,
            email: null,
          },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch auth status" },
      { status: 500 }
    );
  }
}
