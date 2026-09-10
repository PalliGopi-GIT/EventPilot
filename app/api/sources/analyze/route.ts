import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { runSourceAnalyzerAgent } from "@/lib/agents/sourceAnalyzer";
import { SourceAnalyzeRequestSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const rate = rateLimit(`analyze_${user.id}`, 15, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = SourceAnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const source = await prisma.source.findUnique({
      where: { id: parsed.data.sourceId },
    });

    if (!source || source.userId !== user.id) {
      return NextResponse.json(
        { error: "Source not found or access unauthorized" },
        { status: 404 }
      );
    }

    // Determine input for Agent 1
    const isImage = source.fileType.startsWith("image/");
    const agentInput = {
      fileName: source.fileName,
      text: source.extractedText || (!isImage ? source.rawContent || undefined : undefined),
      imageBase64: isImage ? source.rawContent || undefined : undefined,
      imageMimeType: isImage ? source.fileType : undefined,
    };

    // Run Agent 1
    const agentResult = await runSourceAnalyzerAgent(agentInput);

    // Update Source record
    await prisma.source.update({
      where: { id: source.id },
      data: {
        eventDetected: agentResult.analysis.eventDetected,
        confidence: agentResult.analysis.confidence,
        sourceType: agentResult.analysis.sourceType,
        status: "ANALYZED",
        metadata: JSON.stringify({
          entities: agentResult.analysis.detectedEntities,
          recommendedActions: agentResult.analysis.recommendedActions,
          summary: agentResult.analysis.summary,
        }),
      },
    });

    // Create or update Event record
    const event = await prisma.event.create({
      data: {
        userId: user.id,
        sourceId: source.id,
        name: agentResult.extractedEvent.name || "Untitled Event",
        date: agentResult.extractedEvent.date,
        time: agentResult.extractedEvent.time,
        venue: agentResult.extractedEvent.venue,
        organizer: agentResult.extractedEvent.organizer,
        description: agentResult.extractedEvent.description,
        audience: agentResult.extractedEvent.audience,
        registrationRequired: agentResult.extractedEvent.registrationRequired,
        confidence: agentResult.extractedEvent.confidence,
        rawAiOutput: JSON.stringify(agentResult),
        status: "DRAFT",
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "SOURCE_ANALYZE",
      resourceType: "source",
      resourceId: source.id,
      details: {
        confidence: agentResult.analysis.confidence,
        eventDetected: agentResult.analysis.eventDetected,
        eventId: event.id,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: agentResult.analysis,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        venue: event.venue,
        organizer: event.organizer,
        description: event.description,
        audience: event.audience,
        registrationRequired: event.registrationRequired,
        confidence: event.confidence,
        status: event.status,
      },
      processingTimeMs: agentResult.processingTimeMs,
    });
  } catch (err: any) {
    console.error("Source analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze source with AI" },
      { status: 500 }
    );
  }
}
