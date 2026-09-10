import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { modifyForm } from "@/lib/ai/modifyForm";
import { createActionPlan } from "@/lib/agents/actionPlanner";
import { FormModifyRequestSchema } from "@/lib/validation/schemas";
import { type FormDefinition } from "@/lib/ai/schemas";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const rate = rateLimit(`form_mod_${user.id}`, 20, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = FormModifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const form = await prisma.form.findUnique({
      where: { id: parsed.data.formId },
      include: { questions: { orderBy: { questionIndex: "asc" } } },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    // Build current FormDefinition
    const currentQuestions = JSON.parse(form.questionsJson);
    const currentFormDef: FormDefinition = {
      title: form.title,
      description: form.description || "",
      formType: (form.formType as "REGISTRATION" | "FEEDBACK") || "REGISTRATION",
      questions: currentQuestions,
    };

    // Call GLM Natural Language Form Modifier
    const modResult = await modifyForm({
      currentForm: currentFormDef,
      userInstruction: parsed.data.userInstruction,
    });

    const updatedDef = modResult.modifiedForm;

    // Update Action Plan
    const actionPlan = createActionPlan({
      form: updatedDef,
      targetAccountEmail: user.googleConnection?.googleEmail,
    });

    // Replace questions in database
    await prisma.$transaction([
      prisma.formQuestion.deleteMany({
        where: { formId: form.id },
      }),
      prisma.form.update({
        where: { id: form.id },
        data: {
          title: updatedDef.title,
          description: updatedDef.description,
          questionsJson: JSON.stringify(updatedDef.questions),
          actionPlanJson: JSON.stringify(actionPlan),
          status: "GENERATED",
          questions: {
            create: updatedDef.questions.map((q, idx) => ({
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
      }),
    ]);

    await recordAuditLog({
      userId: user.id,
      action: "FORM_NL_MODIFY",
      resourceType: "form",
      resourceId: form.id,
      details: {
        instruction: parsed.data.userInstruction,
        explanation: modResult.explanation,
        questionCount: updatedDef.questions.length,
      },
    });

    return NextResponse.json({
      success: true,
      explanation: modResult.explanation,
      form: {
        id: form.id,
        title: updatedDef.title,
        description: updatedDef.description,
        formType: updatedDef.formType,
        questions: updatedDef.questions,
        actionPlan,
        status: "GENERATED",
      },
    });
  } catch (err: any) {
    console.error("Form modification error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to modify form with AI" },
      { status: 500 }
    );
  }
}
