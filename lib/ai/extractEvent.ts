import { callGLMStructured } from "./client";
import { EventExtractionSchema, type EventExtractionResult } from "./schemas";

export interface ExtractEventInput {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  fileName: string;
}

export async function extractEvent(input: ExtractEventInput): Promise<EventExtractionResult> {
  const systemPrompt = `You are a precision Event Extraction Agent.
Your task is to extract structured event details from the provided event source.

RULES:
1. Extract the event name, date, time, venue, organizer, description, target audience, and whether registration is explicitly required.
2. If any field is NOT present or ambiguous in the source, set it to NULL. NEVER hallucinate or guess dates, times, or locations.
3. Calculate a calculated confidence score (0.0 to 1.0) based on verified factual presence of essential event fields.
4. Output ONLY valid JSON matching the exact schema:
{
  "name": "Event Title",
  "date": "YYYY-MM-DD or readable date or null",
  "time": "Event time or null",
  "venue": "Event venue/platform or null",
  "organizer": "Organizing body/host or null",
  "description": "Concise overview or null",
  "audience": "Target audience or null",
  "registrationRequired": boolean,
  "confidence": number between 0.0 and 1.0
}`;

  let userPrompt = `Extract structured event information from: "${input.fileName}".\n`;
  if (input.text) {
    userPrompt += `\nContent:\n---\n${input.text.slice(0, 10000)}\n---`;
  } else if (input.imageBase64) {
    userPrompt += `\nRead all visual text, titles, subtitles, schedules, locations, and contact info from the image.`;
  }

  return callGLMStructured<EventExtractionResult>(
    {
      systemPrompt,
      userPrompt,
      imageBase64: input.imageBase64,
      imageMimeType: input.imageMimeType,
      temperature: 0.1,
    },
    EventExtractionSchema
  );
}
