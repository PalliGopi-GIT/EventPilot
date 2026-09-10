import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { syncRealGoogleFormResponses } from "@/lib/google/responses";
import { GoogleResponsesFetchRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const parsed = GoogleResponsesFetchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { formId } = parsed.data;

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    if (!form.googleFormId) {
      return NextResponse.json(
        { error: "This form has not been deployed to Google Forms yet." },
        { status: 400 }
      );
    }

    // Retrieve real responses from Google Forms API
    const syncResult = await syncRealGoogleFormResponses(user.id, form.id);

    await recordAuditLog({
      userId: user.id,
      action: "RESPONSES_SYNC",
      resourceType: "form",
      resourceId: form.id,
      details: { totalFetched: syncResult.totalFetched },
    });

    return NextResponse.json({
      success: true,
      totalResponses: syncResult.totalFetched,
      responses: syncResult.responses,
    });
  } catch (err: any) {
    console.error("Fetch responses error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch responses from Google Forms" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ error: "formId query parameter is required" }, { status: 400 });
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
    });

    const parsedResponses = responses.map((r) => ({
      id: r.id,
      googleResponseId: r.googleResponseId,
      respondentEmail: r.respondentEmail,
      answers: JSON.parse(r.answersJson),
      submittedAt: r.submittedAt,
    }));

    return NextResponse.json({
      success: true,
      totalCount: responses.length,
      responses: parsedResponses,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve stored responses" },
      { status: 500 }
    );
  }
}
