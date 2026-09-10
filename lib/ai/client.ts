/**
 * TokenRouter -> GLM AI Client
 * Centralized LLM communication layer.
 * Strictly outputs structured JSON validated with Zod.
 */

export interface AICompletionOptions {
  systemPrompt?: string;
  userPrompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}

export class AIClientError extends Error {
  constructor(message: string, public statusCode?: number, public rawResponse?: string) {
    super(message);
    this.name = "AIClientError";
  }
}

/**
 * Extracts and parses JSON from LLM output, handling markdown fences and extraneous text.
 */
export function extractJsonFromText(rawText: string): any {
  if (!rawText) {
    throw new AIClientError("Empty response received from AI model");
  }

  const trimmed = rawText.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to next extraction strategies
  }

  // 2. Markdown fence extraction ```json ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // 3. Find outermost JSON object {...} or array [...]
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue
    }
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Failed all
    }
  }

  throw new AIClientError(`Failed to parse valid JSON from AI response: ${trimmed.slice(0, 200)}...`);
}

/**
 * Call TokenRouter -> GLM model
 */
export async function callGLM(options: AICompletionOptions): Promise<string> {
  const apiKey = process.env.TOKENROUTER_API_KEY || process.env.AI_API_KEY;
  const baseUrl =
    process.env.TOKENROUTER_BASE_URL ||
    process.env.AI_BASE_URL ||
    "https://api.tokenrouter.io/v1";
  const model = process.env.AI_MODEL || "glm-4-plus";

  if (!apiKey) {
    throw new AIClientError(
      "Missing TOKENROUTER_API_KEY in environment variables. Please configure it in .env"
    );
  }

  const messages: any[] = [];

  if (options.systemPrompt) {
    messages.push({
      role: "system",
      content: options.systemPrompt,
    });
  }

  // Build user message content (supports multimodal image + text)
  if (options.imageBase64) {
    const mimeType = options.imageMimeType || "image/png";
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: options.userPrompt,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${options.imageBase64}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: options.userPrompt,
    });
  }

  const body: any = {
    model: model,
    messages: messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 3000,
  };

  if (options.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  let lastError: Error | null = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://eventpilot.ai",
          "X-Title": "EventPilot AI Platform",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIClientError(
          `TokenRouter/GLM API error (${response.status}): ${errorText}`,
          response.status,
          errorText
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AIClientError("No content returned in AI response choices");
      }

      return content;
    } catch (err: any) {
      lastError = err;
      if (err.statusCode === 429 || (err.statusCode && err.statusCode >= 500)) {
        // Wait with exponential backoff on rate limits or server errors
        await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new AIClientError("Failed to call TokenRouter/GLM after retries");
}

/**
 * Convenience helper to execute prompt and validate against a Zod schema
 */
export async function callGLMStructured<T>(
  options: AICompletionOptions,
  validator: { parse: (data: unknown) => T }
): Promise<T> {
  const rawText = await callGLM({
    ...options,
    responseFormat: "json_object",
  });

  const parsedJson = extractJsonFromText(rawText);
  return validator.parse(parsedJson);
}
