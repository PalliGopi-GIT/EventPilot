import type { FormDefinition, ActionPlan } from "../ai/schemas";

export interface CreateActionPlanInput {
  form: FormDefinition;
  targetAccountEmail?: string;
}

/**
 * Agent 2: Action Planner
 * Formulates a deterministic execution plan for creating or updating a Google Form.
 * Requires explicit Human-in-the-Loop approval before any external API calls.
 */
export function createActionPlan(input: CreateActionPlanInput): ActionPlan {
  const { form, targetAccountEmail } = input;

  return {
    action: "CREATE_GOOGLE_FORM",
    formType: form.formType,
    title: form.title,
    description: form.description,
    questionCount: form.questions.length,
    questionsSummary: form.questions.map((q) => ({
      label: q.label,
      type: q.type,
      required: q.required,
    })),
    provider: "Google Forms",
    requiresApproval: true,
    targetAccount: targetAccountEmail || "Connected Google Account",
  };
}
