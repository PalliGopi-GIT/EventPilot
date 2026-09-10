import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { createRealGoogleForm } from "@/lib/google/forms";
import { GoogleFormCreateRequestSchema } from "@/lib/validation/schemas";
import type { FormDefinition } from "@/lib/ai/schemas";

export async function POST(req: NextRequest) {
  let formId: string | undefined;
  let requestId: string | undefined;

  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const parsed = GoogleFormCreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    formId = parsed.data.formId;
    requestId = parsed.data.requestId;

    // Fetch form and check authorization
    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    // IDEMPOTENCY CHECK 1: If form already has googleFormId or was created with this requestId
    if (form.googleFormId && form.status === "CREATED") {
      return NextResponse.json({
        success: true,
        alreadyCreated: true,
        googleFormId: form.googleFormId,
        formUrl: form.googleFormUrl,
        responderUri: form.googleResponderUri,
        message: "Form was already created previously (Idempotent return).",
      });
    }

    // IDEMPOTENCY CHECK 2: Check IdempotencyRecord table
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: { key: requestId },
    });

    if (existingRecord) {
      if (existingRecord.status === "COMPLETED" && existingRecord.resultJson) {
        const cached = JSON.parse(existingRecord.resultJson);
        return NextResponse.json({
          success: true,
          alreadyCreated: true,
          ...cached,
        });
      }
      if (existingRecord.status === "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Creation request is currently being processed. Please wait a moment." },
          { status: 409 }
        );
      }
    }

    // Verify User has connected Google Account
    if (!user.googleConnection) {
      return NextResponse.json(
        {
          error: "Google account not connected. Please connect your Google account to create forms.",
          requireGoogleAuth: true,
        },
        { status: 401 }
      );
    }

    // Mark idempotency as IN_PROGRESS
    await prisma.idempotencyRecord.upsert({
      where: { key: requestId },
      update: { status: "IN_PROGRESS" },
      create: {
        key: requestId,
        action: "CREATE_GOOGLE_FORM",
        userId: user.id,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Mark form as CREATING
    await prisma.form.update({
      where: { id: formId },
      data: { status: "CREATING" },
    });

    // Build form definition
    const questions = JSON.parse(form.questionsJson);
    const formDef: FormDefinition = {
      title: form.title,
      description: form.description || "",
      formType: (form.formType as "REGISTRATION" | "FEEDBACK") || "REGISTRATION",
      questions,
    };

    // Execute Real Google Form Creation
    const result = await createRealGoogleForm(user.id, formDef);

    // Update database Form record
    await prisma.form.update({
      where: { id: formId },
      data: {
        status: "CREATED",
        googleFormId: result.googleFormId,
        googleFormUrl: result.formUrl,
        googleResponderUri: result.responderUri,
      },
    });

    const responsePayload = {
      googleFormId: result.googleFormId,
      formUrl: result.formUrl,
      responderUri: result.responderUri,
      title: result.title,
      questionCount: result.questionCount,
    };

    // Mark idempotency as COMPLETED
    await prisma.idempotencyRecord.update({
      where: { key: requestId },
      data: {
        status: "COMPLETED",
        resultJson: JSON.stringify(responsePayload),
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "GOOGLE_FORM_CREATE",
      resourceType: "form",
      resourceId: form.id,
      details: {
        googleFormId: result.googleFormId,
        formUrl: result.formUrl,
        responderUri: result.responderUri,
      },
    });

    return NextResponse.json({
      success: true,
      ...responsePayload,
    });
  } catch (err: any) {
    console.error("Google form creation error:", err);

    try {
      if (formId) {
        await prisma.form.updateMany({
          where: { id: formId, status: "CREATING" },
          data: { status: "FAILED" },
        });
      }
      if (requestId) {
        await prisma.idempotencyRecord.updateMany({
          where: { key: requestId, status: "IN_PROGRESS" },
          data: { status: "FAILED" },
        });
      }
    } catch (cleanupErr) {
      console.error("Failed to mark form creation as FAILED:", cleanupErr);
    }

    return NextResponse.json(
      { error: err.message || "Failed to create Google Form" },
      { status: 500 }
    );
  }
}
