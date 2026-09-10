import { analyzeSource, type AnalyzeSourceInput } from "../ai/analyzeSource";
import { extractEvent } from "../ai/extractEvent";
import type { SourceAnalysisResult, EventExtractionResult } from "../ai/schemas";

export interface Agent1Result {
  analysis: SourceAnalysisResult;
  extractedEvent: EventExtractionResult;
  processingTimeMs: number;
}

/**
 * Agent 1: Source Analyzer
 * Inspects source, classifies document, extracts structured event data,
 * assesses confidence, and suggests actions.
 */
export async function runSourceAnalyzerAgent(input: AnalyzeSourceInput): Promise<Agent1Result> {
  const startTime = Date.now();

  // Run analysis and event extraction
  const [analysis, extractedEvent] = await Promise.all([
    analyzeSource(input),
    extractEvent(input),
  ]);

  // Adjust combined confidence score based on entity presence
  const entityCount = Object.values(analysis.detectedEntities).filter(Boolean).length;
  const entityRatio = entityCount / 5;
  const calculatedConfidence = Number(
    ((analysis.confidence * 0.4 + extractedEvent.confidence * 0.4 + entityRatio * 0.2)).toFixed(2)
  );

  analysis.confidence = Math.min(Math.max(calculatedConfidence, 0.05), 0.99);
  extractedEvent.confidence = analysis.confidence;

  const processingTimeMs = Date.now() - startTime;

  return {
    analysis,
    extractedEvent,
    processingTimeMs,
  };
}
