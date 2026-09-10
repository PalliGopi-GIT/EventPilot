import { callGLMStructured } from "./client";
import { FormModificationSchema, type FormModificationResult, type FormDefinition } from "./schemas";

export interface ModifyFormInput {
  currentForm: FormDefinition;
  userInstruction: string;
}

export async function modifyForm(input: ModifyFormInput): Promise<FormModificationResult> {
  const { currentForm, userInstruction } = input;

  const systemPrompt = `You are an intelligent Conversational Form Editor Assistant.
Your job is to modify an existing Google Form definition based on natural language instructions from the user.

RULES:
1. ALWAYS preserve existing questions unless the user explicitly asks to remove, replace, or reorder them.
2. If the user asks to add a question, choose the most appropriate question type (short_answer, paragraph, multiple_choice, checkbox, dropdown, linear_scale).
3. If the user asks to change requirements (e.g. "make email mandatory"), update required: true.
4. If the user asks to shorten, keep only the highest-value core questions and remove redundant ones.
5. Provide a clear, brief explanation of what changes you performed in "explanation".
6. Every question must have a unique "id" slug.

OUTPUT SCHEMA (Must be valid JSON):
{
  "explanation": "Summarize what was changed (e.g., 'Added Phone Number field and marked Email as required.')",
  "modifiedForm": {
    "title": "...",
    "description": "...",
    "formType": "REGISTRATION" | "FEEDBACK",
    "questions": [ ...updated question array... ]
  }
}`;

  const userPrompt = `CURRENT FORM DEFINITION:
${JSON.stringify(currentForm, null, 2)}

USER INSTRUCTION:
"${userInstruction}"

Please apply this instruction and return the updated form specification.`;

  return callGLMStructured<FormModificationResult>(
    {
      systemPrompt,
      userPrompt,
      temperature: 0.2,
    },
    FormModificationSchema
  );
}
