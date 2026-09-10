import { callGLMStructured } from "./client";
import { SourceAnalysisSchema, type SourceAnalysisResult } from "./schemas";

export interface AnalyzeSourceInput {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  fileName: string;
}

export async function analyzeSource(input: AnalyzeSourceInput): Promise<SourceAnalysisResult> {
  const systemPrompt = `You are Agent 1 (Source Analyzer) in an autonomous event automation system.
Your job is to examine an uploaded file (poster, brochure, text schedule, document) and:
1. Classify the source type ('event_poster', 'schedule', 'document', 'raw_text', 'unknown').
2. Determine if an actual event is detected.
3. Assess detected core entities: hasTitle, hasDate, hasTime, hasVenue, hasOrganizer.
4. Calculate a realistic confidence score (0.00 to 1.00) based on completeness and clarity of information. NEVER hardcode 1.0 or fake 0.99 if details are missing.
5. Provide a crisp summary of what this document represents.
6. Recommend appropriate follow-up actions (e.g. ['registration_form', 'feedback_form']).

CRITICAL: Return ONLY valid JSON matching this schema:
{
  "sourceType": "event_poster" | "schedule" | "document" | "raw_text" | "unknown",
  "eventDetected": boolean,
  "confidence": number (between 0.0 and 1.0),
  "summary": "Clear summary of the source content",
  "detectedEntities": {
    "hasTitle": boolean,
    "hasDate": boolean,
    "hasTime": boolean,
    "hasVenue": boolean,
    "hasOrganizer": boolean
  },
  "recommendedActions": ["registration_form" | "feedback_form" | "manual_review"]
}`;

  let userPrompt = `Analyze this uploaded source file: "${input.fileName}".\n`;
  if (input.text) {
    userPrompt += `\nExtracted Content / Text:\n---\n${input.text.slice(0, 8000)}\n---`;
  } else if (input.imageBase64) {
    userPrompt += `\nPlease inspect the attached image closely for all event details, titles, dates, locations, and organizers.`;
  } else {
    userPrompt += `\nNo content extracted.`;
  }

  return callGLMStructured<SourceAnalysisResult>(
    {
      systemPrompt,
      userPrompt,
      imageBase64: input.imageBase64,
      imageMimeType: input.imageMimeType,
      temperature: 0.1,
    },
    SourceAnalysisSchema
  );
}
