import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { FormApproveRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const parsed = FormApproveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid approval payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { formId, requestId } = parsed.data;

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    // Check if Google is connected for this user
    const hasGoogle = !!user.googleConnection;

    const updated = await prisma.form.update({
      where: { id: formId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: user.email,
        requestId: requestId,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "FORM_HUMAN_APPROVE",
      resourceType: "form",
      resourceId: form.id,
      details: {
        requestId,
        title: form.title,
        googleConnected: hasGoogle,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Action plan approved by user.",
      form: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
        requestId: updated.requestId,
        googleConnected: hasGoogle,
        googleEmail: user.googleConnection?.googleEmail || null,
      },
    });
  } catch (err: any) {
    console.error("Form approval error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to approve action plan" },
      { status: 500 }
    );
  }
}
