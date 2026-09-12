import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendFormEmail } from "@/lib/email/client";
import { FormSendEmailRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FormSendEmailRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { formId, recipients } = parsed.data;

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form || !form.googleResponderUri) {
      return NextResponse.json(
        { error: "Form not found or Google Form not yet deployed" },
        { status: 404 }
      );
    }

    await sendFormEmail({
      to: recipients,
      subject: `Please fill out: ${form.title}`,
      responderUri: form.googleResponderUri,
      formTitle: form.title,
    });

    return NextResponse.json({
      success: true,
      message: `Form link sent to ${recipients.length} recipient(s)`,
    });
  } catch (err: any) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}