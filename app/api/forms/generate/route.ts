import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { generateForm } from "@/lib/ai/generateForm";
import { createActionPlan } from "@/lib/agents/actionPlanner";
import { FormGenerateRequestSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const rate = rateLimit(`form_gen_${user.id}`, 15, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = FormGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
    });

    if (!event || event.userId !== user.id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Call GLM Form Generator
    const formDef = await generateForm({
      event: {
        name: event.name,
        date: event.date,
        time: event.time,
        venue: event.venue,
        organizer: event.organizer,
        description: event.description,
        audience: event.audience,
        registrationRequired: event.registrationRequired,
        confidence: event.confidence,
      },
      formType: parsed.data.formType,
      customInstructions: parsed.data.customInstructions,
    });

    // Create Action Plan
    const actionPlan = createActionPlan({
      form: formDef,
      targetAccountEmail: user.googleConnection?.googleEmail,
    });

    // Persist Form to Database
    const form = await prisma.form.create({
      data: {
        userId: user.id,
        eventId: event.id,
        title: formDef.title,
        description: formDef.description || "",
        formType: formDef.formType,
        questionsJson: JSON.stringify(formDef.questions),
        actionPlanJson: JSON.stringify(actionPlan),
        status: "GENERATED",
        questions: {
          create: formDef.questions.map((q, idx) => ({
            questionIndex: idx,
            label: q.label,
            type: q.type,
            required: q.required,
            optionsJson: q.options ? JSON.stringify(q.options) : null,
            scaleMin: q.scaleMin ?? 1,
            scaleMax: q.scaleMax ?? 5,
            scaleLowLabel: q.scaleLowLabel,
            scaleHighLabel: q.scaleHighLabel,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "FORM_GENERATE",
      resourceType: "form",
      resourceId: form.id,
      details: { title: form.title, type: form.formType, questionCount: formDef.questions.length },
    });

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        formType: form.formType,
        questions: formDef.questions,
        actionPlan,
        status: form.status,
      },
    });
  } catch (err: any) {
    console.error("Form generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate form" },
      { status: 500 }
    );
  }
}
