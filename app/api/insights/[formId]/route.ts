import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { analyzeResponses } from "@/lib/ai/analyzeResponses";
import { type FormDefinition } from "@/lib/ai/schemas";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  try {
    const user = await getCurrentUser();
    const { formId } = await params;

    const analysis = await prisma.responseAnalysis.findUnique({
      where: { formId },
    });

    if (!analysis) {
      return NextResponse.json({
        hasAnalysis: false,
        analysis: null,
      });
    }

    return NextResponse.json({
      hasAnalysis: true,
      analysis: {
        totalResponses: analysis.totalResponses,
        averageRating: analysis.averageRating,
        sentiment: analysis.sentiment,
        topStrengths: analysis.topStrengthsJson ? JSON.parse(analysis.topStrengthsJson) : [],
        commonSuggestions: analysis.commonSuggestionsJson
          ? JSON.parse(analysis.commonSuggestionsJson)
          : [],
        themes: analysis.themesJson ? JSON.parse(analysis.themesJson) : [],
        recommendations: analysis.recommendationsJson
          ? JSON.parse(analysis.recommendationsJson)
          : [],
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch response insights" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  try {
    const user = await getCurrentUser();
    const { formId } = await params;

    const rate = rateLimit(`insights_${user.id}`, 10, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        responses: {
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!form || form.userId !== user.id) {
      return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
    }

    const questions = JSON.parse(form.questionsJson);
    const formDef: FormDefinition = {
      title: form.title,
      description: form.description || "",
      formType: (form.formType as "REGISTRATION" | "FEEDBACK") || "REGISTRATION",
      questions,
    };

    const storedResponses = form.responses.map((r) => ({
      googleResponseId: r.googleResponseId,
      respondentEmail: r.respondentEmail,
      answers: JSON.parse(r.answersJson),
      submittedAt: r.submittedAt.toISOString(),
    }));

    // Run GLM AI Response Analysis on real data
    const analysisResult = await analyzeResponses({
      form: formDef,
      responses: storedResponses,
    });

    // Save to Database
    const savedAnalysis = await prisma.responseAnalysis.upsert({
      where: { formId: form.id },
      update: {
        totalResponses: analysisResult.totalResponses,
        averageRating: analysisResult.averageRating,
        sentiment: analysisResult.sentiment,
        topStrengthsJson: JSON.stringify(analysisResult.topStrengths),
        commonSuggestionsJson: JSON.stringify(analysisResult.commonSuggestions),
        themesJson: JSON.stringify(analysisResult.themes),
        recommendationsJson: JSON.stringify(analysisResult.recommendations),
        rawAnalysisJson: JSON.stringify(analysisResult),
        analyzedAt: new Date(),
      },
      create: {
        formId: form.id,
        totalResponses: analysisResult.totalResponses,
        averageRating: analysisResult.averageRating,
        sentiment: analysisResult.sentiment,
        topStrengthsJson: JSON.stringify(analysisResult.topStrengths),
        commonSuggestionsJson: JSON.stringify(analysisResult.commonSuggestions),
        themesJson: JSON.stringify(analysisResult.themes),
        recommendationsJson: JSON.stringify(analysisResult.recommendations),
        rawAnalysisJson: JSON.stringify(analysisResult),
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "RESPONSES_ANALYZE",
      resourceType: "form",
      resourceId: form.id,
      details: {
        totalResponses: analysisResult.totalResponses,
        avgRating: analysisResult.averageRating,
        sentiment: analysisResult.sentiment,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (err: any) {
    console.error("Analysis generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate AI insights from responses" },
      { status: 500 }
    );
  }
}
