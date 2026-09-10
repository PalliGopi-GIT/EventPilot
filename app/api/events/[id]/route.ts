import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { EventUpdateRequestSchema } from "@/lib/validation/schemas";
import { sanitizeSafeText } from "@/lib/security/sanitize";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        source: true,
        forms: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event || event.userId !== user.id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const body = await req.json();
    const parsed = EventUpdateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        name: sanitizeSafeText(parsed.data.name, 255),
        date: parsed.data.date ? sanitizeSafeText(parsed.data.date, 100) : null,
        time: parsed.data.time ? sanitizeSafeText(parsed.data.time, 100) : null,
        venue: parsed.data.venue ? sanitizeSafeText(parsed.data.venue, 255) : null,
        organizer: parsed.data.organizer ? sanitizeSafeText(parsed.data.organizer, 255) : null,
        description: parsed.data.description ? sanitizeSafeText(parsed.data.description, 2000) : null,
        audience: parsed.data.audience ? sanitizeSafeText(parsed.data.audience, 255) : null,
        registrationRequired: parsed.data.registrationRequired,
        status: "REVIEWED",
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "EVENT_REVIEW_UPDATE",
      resourceType: "event",
      resourceId: updated.id,
      details: { name: updated.name },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    console.error("Event update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update event" },
      { status: 500 }
    );
  }
}
