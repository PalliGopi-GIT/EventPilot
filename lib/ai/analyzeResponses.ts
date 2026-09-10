import { callGLMStructured } from "./client";
import {
  ResponseAnalysisSchema,
  type ResponseAnalysisResult,
  type FormDefinition,
} from "./schemas";

export interface StoredResponseItem {
  googleResponseId: string;
  respondentEmail?: string | null;
  answers: Record<string, any>; // question label/id -> answer
  submittedAt: string;
}

export interface AnalyzeResponsesInput {
  form: FormDefinition;
  responses: StoredResponseItem[];
}

export async function analyzeResponses(input: AnalyzeResponsesInput): Promise<ResponseAnalysisResult> {
  const { form, responses } = input;

  if (responses.length === 0) {
    return {
      totalResponses: 0,
      averageRating: null,
      sentiment: "NEUTRAL",
      topStrengths: [],
      commonSuggestions: [],
      themes: [],
      recommendations: ["Collect participant responses through the Google Form to view insights."],
      keyTakeaways: ["No responses have been submitted yet."],
    };
  }

  // Compute direct mathematical metrics where possible
  let ratingSum = 0;
  let ratingCount = 0;

  responses.forEach((r) => {
    Object.entries(r.answers).forEach(([key, val]) => {
      const numVal = Number(val);
      if (!isNaN(numVal) && numVal >= 1 && numVal <= 10) {
        ratingSum += numVal;
        ratingCount += 1;
      }
    });
  });

  const calculatedAvgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : null;

  const systemPrompt = `You are an executive Event Intelligence & Analytics Agent.
You are analyzing real participant responses from a Google Form.

CRITICAL INTEGRITY RULES:
1. Base all insights STRICTLY on the actual responses provided. Do NOT hallucinate feedback or sentiments not expressed in the data.
2. Calculate/reflect real average ratings if present.
3. Identify genuine recurring themes, strengths, and critique points.
4. Provide actionable, high-value recommendations for event organizers.

OUTPUT SCHEMA (Must be valid JSON):
{
  "totalResponses": ${responses.length},
  "averageRating": ${calculatedAvgRating !== null ? calculatedAvgRating : "null"},
  "sentiment": "POSITIVE" | "NEUTRAL" | "MIXED" | "NEGATIVE",
  "topStrengths": ["Strength 1", "Strength 2", ...],
  "commonSuggestions": ["Suggestion 1", "Suggestion 2", ...],
  "themes": [
    {
      "theme": "Theme title",
      "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED",
      "count": number,
      "exampleQuotes": ["quote 1", "quote 2"]
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", ...]
}`;

  const userPrompt = `FORM DETAILS:
Title: ${form.title}
Description: ${form.description}
Total Submissions: ${responses.length}

SUBMITTED RESPONSES DATA:
${JSON.stringify(responses.slice(0, 100), null, 2)}

Analyze the above responses and produce comprehensive event analytics.`;

  return callGLMStructured<ResponseAnalysisResult>(
    {
      systemPrompt,
      userPrompt,
      temperature: 0.1,
    },
    ResponseAnalysisSchema
  );
}
