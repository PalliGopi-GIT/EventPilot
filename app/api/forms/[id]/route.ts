import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        event: true,
        questions: {
          orderBy: { questionIndex: "asc" },
        },
        analysis: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const questionsParsed = JSON.parse(form.questionsJson);
    const actionPlanParsed = form.actionPlanJson ? JSON.parse(form.actionPlanJson) : null;

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        formType: form.formType,
        questions: questionsParsed,
        actionPlan: actionPlanParsed,
        status: form.status,
        requestId: form.requestId,
        googleFormId: form.googleFormId,
        googleFormUrl: form.googleFormUrl,
        googleResponderUri: form.googleResponderUri,
        responseCount: form._count.responses,
        hasAnalysis: !!form.analysis,
        event: form.event,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch form details" },
      { status: 500 }
    );
  }
}
