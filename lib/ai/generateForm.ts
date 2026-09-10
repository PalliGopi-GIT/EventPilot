import { callGLMStructured } from "./client";
import { FormDefinitionSchema, type FormDefinition, type EventExtractionResult } from "./schemas";

export interface GenerateFormInput {
  event: EventExtractionResult;
  formType: "REGISTRATION" | "FEEDBACK";
  customInstructions?: string;
}

export async function generateForm(input: GenerateFormInput): Promise<FormDefinition> {
  const { event, formType, customInstructions } = input;

  const systemPrompt = `You are an expert Google Forms Architect.
Your task is to generate a comprehensive, highly relevant, professional form specification for an event.

Form Type requested: ${formType}

AVAILABLE QUESTION TYPES:
- short_answer: for brief text like Full Name, College, Roll Number, Organization, Email
- paragraph: for open-ended questions like "Key Takeaways", "Questions for speaker", "Suggestions for improvement"
- multiple_choice: for single-select choices (e.g. Year of study, Department, Food preference)
- checkbox: for multi-select choices (e.g. Topics of interest, Workshop tracks)
- dropdown: for long select lists (e.g. City/Branch)
- linear_scale: for numeric ratings (e.g., scaleMin: 1, scaleMax: 5, scaleLowLabel: "Poor", scaleHighLabel: "Excellent")

FORM DESIGN GUIDELINES:
- For REGISTRATION forms: Collect attendee identity, contact, background/department, expectations, prerequisites confirmation.
- For FEEDBACK forms: Collect overall rating (linear_scale), content quality, speaker effectiveness, pace, logistics/organization, key takeaways (paragraph), future topic requests (paragraph).
- Make sure IDs are unique slug-like strings (e.g. "full_name", "overall_rating", "speaker_clarity").
- Always include helpful, concise labels.

OUTPUT SCHEMA (Must be strictly valid JSON):
{
  "title": "${event.name || "Event"} ${formType === "REGISTRATION" ? "Registration" : "Feedback"}",
  "description": "Short welcoming and clear description of the form purpose.",
  "formType": "${formType}",
  "questions": [
    {
      "id": "unique_id_slug",
      "label": "Question text",
      "type": "short_answer" | "paragraph" | "multiple_choice" | "checkbox" | "dropdown" | "linear_scale",
      "required": boolean,
      "options": ["Option 1", "Option 2"], // required for multiple_choice, checkbox, dropdown
      "scaleMin": 1, // for linear_scale (0 or 1)
      "scaleMax": 5, // for linear_scale (2 to 10)
      "scaleLowLabel": "Poor", // for linear_scale
      "scaleHighLabel": "Excellent" // for linear_scale
    }
  ]
}`;

  let userPrompt = `Generate a ${formType} form for this event:
Event Name: ${event.name}
Date: ${event.date || "TBD"}
Time: ${event.time || "TBD"}
Venue: ${event.venue || "TBD"}
Organizer: ${event.organizer || "TBD"}
Description: ${event.description || "N/A"}
Audience: ${event.audience || "General Attendees"}`;

  if (customInstructions) {
    userPrompt += `\n\nUser Custom Guidance:\n${customInstructions}`;
  }

  return callGLMStructured<FormDefinition>(
    {
      systemPrompt,
      userPrompt,
      temperature: 0.2,
    },
    FormDefinitionSchema
  );
}
