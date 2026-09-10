import { z } from "zod";

// Question Types supported by Google Forms API
export const QuestionTypeEnum = z.enum([
  "short_answer",
  "paragraph",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "linear_scale",
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

// Form Question Definition
export const QuestionDefinitionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Question label cannot be empty"),
  type: QuestionTypeEnum,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For multiple_choice, checkbox, dropdown
  scaleMin: z.number().int().min(0).max(1).optional().default(1), // 0 or 1 for linear_scale
  scaleMax: z.number().int().min(2).max(10).optional().default(5), // up to 10 for linear_scale
  scaleLowLabel: z.string().optional(),
  scaleHighLabel: z.string().optional(),
});

export type QuestionDefinition = z.infer<typeof QuestionDefinitionSchema>;

// Form Definition Schema
export const FormDefinitionSchema = z.object({
  title: z.string().min(1, "Form title is required"),
  description: z.string().optional().default(""),
  formType: z.enum(["REGISTRATION", "FEEDBACK"]).default("REGISTRATION"),
  questions: z.array(QuestionDefinitionSchema).min(1, "Form must have at least one question"),
});

export type FormDefinition = z.infer<typeof FormDefinitionSchema>;

// Source Analysis Output Schema (Agent 1)
export const SourceAnalysisSchema = z.object({
  sourceType: z.enum(["event_poster", "schedule", "document", "raw_text", "unknown"]),
  eventDetected: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  detectedEntities: z.object({
    hasTitle: z.boolean(),
    hasDate: z.boolean(),
    hasTime: z.boolean(),
    hasVenue: z.boolean(),
    hasOrganizer: z.boolean(),
  }),
  recommendedActions: z.array(z.enum(["registration_form", "feedback_form", "manual_review"])),
});

export type SourceAnalysisResult = z.infer<typeof SourceAnalysisSchema>;

// Event Extraction Schema
export const EventExtractionSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().nullable().optional(), // YYYY-MM-DD or formatted date
  time: z.string().nullable().optional(), // e.g., "10:00 AM" or "14:30"
  venue: z.string().nullable().optional(),
  organizer: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  registrationRequired: z.boolean().default(false),
  confidence: z.number().min(0).max(1),
});

export type EventExtractionResult = z.infer<typeof EventExtractionSchema>;

// Form Modification Schema (Natural Language Form Editor)
export const FormModificationSchema = z.object({
  explanation: z.string().describe("Explanation of changes made based on user prompt"),
  modifiedForm: FormDefinitionSchema,
});

export type FormModificationResult = z.infer<typeof FormModificationSchema>;

// Action Plan Schema
export const ActionPlanSchema = z.object({
  action: z.enum(["CREATE_GOOGLE_FORM", "UPDATE_GOOGLE_FORM"]),
  formType: z.enum(["REGISTRATION", "FEEDBACK"]),
  title: z.string(),
  description: z.string().optional(),
  questionCount: z.number().int().positive(),
  questionsSummary: z.array(
    z.object({
      label: z.string(),
      type: QuestionTypeEnum,
      required: z.boolean(),
    })
  ),
  provider: z.literal("Google Forms"),
  requiresApproval: z.literal(true),
  targetAccount: z.string().optional(),
});

export type ActionPlan = z.infer<typeof ActionPlanSchema>;

// Theme Analysis Item
export const ThemeItemSchema = z.object({
  theme: z.string(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]),
  count: z.number().int().nonnegative(),
  exampleQuotes: z.array(z.string()).optional(),
});

export type ThemeItem = z.infer<typeof ThemeItemSchema>;

// Response Analysis Schema
export const ResponseAnalysisSchema = z.object({
  totalResponses: z.number().int().nonnegative(),
  averageRating: z.number().nullable().optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "MIXED", "NEGATIVE"]),
  topStrengths: z.array(z.string()),
  commonSuggestions: z.array(z.string()),
  themes: z.array(ThemeItemSchema),
  recommendations: z.array(z.string()),
  keyTakeaways: z.array(z.string()),
});

export type ResponseAnalysisResult = z.infer<typeof ResponseAnalysisSchema>;
