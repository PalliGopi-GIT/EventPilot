import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const rate = rateLimit(`dashboard_${user.id}`, 60, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const [events, forms, totalSources, totalEvents, totalForms, totalResponses] = await Promise.all([
      prisma.event.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          source: true,
          forms: {
            include: {
              _count: { select: { responses: true } },
            },
          },
        },
        take: 10,
      }),
      prisma.form.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          event: true,
          analysis: true,
          _count: { select: { responses: true } },
        },
        take: 10,
      }),
      prisma.source.count({ where: { userId: user.id } }),
      prisma.event.count({ where: { userId: user.id } }),
      prisma.form.count({ where: { userId: user.id } }),
      prisma.response.count({ where: { form: { userId: user.id } } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalSources,
        totalEvents,
        totalForms,
        totalResponses,
        googleConnected: !!user.googleConnection,
        googleEmail: user.googleConnection?.googleEmail || null,
      },
      recentEvents: events,
      recentForms: forms.map((f) => ({
        id: f.id,
        title: f.title,
        formType: f.formType,
        status: f.status,
        googleFormId: f.googleFormId,
        googleFormUrl: f.googleFormUrl,
        googleResponderUri: f.googleResponderUri,
        responseCount: f._count.responses,
        hasAnalysis: !!f.analysis,
        eventName: f.event?.name,
        createdAt: f.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
