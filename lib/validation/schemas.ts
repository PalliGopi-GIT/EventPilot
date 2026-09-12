import { z } from "zod";
import { FormDefinitionSchema, QuestionTypeEnum } from "../ai/schemas";

export const SourceUploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive().max(15 * 1024 * 1024), // 15MB max
  rawContent: z.string().optional(), // base64 or raw text
  extractedText: z.string().optional(),
});

export const SourceAnalyzeRequestSchema = z.object({
  sourceId: z.string().min(1),
});

export const EventUpdateRequestSchema = z.object({
  name: z.string().min(1),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  organizer: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  registrationRequired: z.boolean().default(false),
});

export const FormGenerateRequestSchema = z.object({
  eventId: z.string().min(1),
  formType: z.enum(["REGISTRATION", "FEEDBACK"]).default("REGISTRATION"),
  customInstructions: z.string().optional(),
});

export const FormModifyRequestSchema = z.object({
  formId: z.string().min(1),
  userInstruction: z.string().min(1, "Instruction cannot be empty"),
});

export const FormApproveRequestSchema = z.object({
  formId: z.string().min(1),
  requestId: z.string().min(1, "Client idempotency requestId is required"),
});

export const GoogleFormCreateRequestSchema = z.object({
  formId: z.string().min(1),
  requestId: z.string().min(1, "Idempotency requestId is required"),
});

export const GoogleResponsesFetchRequestSchema = z.object({
  formId: z.string().min(1),
});

export const FormSendEmailRequestSchema = z.object({
  formId: z.string().min(1),
  recipients: z.array(z.string().email()).min(1, "At least one valid recipient required"),
});

export const InsightsAnalyzeRequestSchema = z.object({
  formId: z.string().min(1),
});
