import { google } from "googleapis";
import { prisma } from "../db/prisma";
import { getAuthenticatedClientForUser } from "./oauth";

export interface NormalizedAnswer {
  questionId: string;
  questionTitle?: string;
  answers: string[];
  singleValue: string;
}

export interface NormalizedResponse {
  responseId: string;
  submittedAt: string;
  respondentEmail?: string | null;
  answers: Record<string, string>; // questionTitle or ID -> answer
}

/**
 * Fetches real Google Form responses and syncs them to the database.
 */
export async function syncRealGoogleFormResponses(userId: string, formDbId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formDbId },
    include: { questions: true },
  });

  if (!form || !form.googleFormId) {
    throw new Error("Form not found or has not been deployed to Google Forms yet.");
  }

  const { oauth2Client } = await getAuthenticatedClientForUser(userId);
  const forms = google.forms({ version: "v1", auth: oauth2Client });

  // 1. Get the form structure to map question IDs to question labels
  const formDetails = await forms.forms.get({ formId: form.googleFormId });
  const questionMap = new Map<string, string>(); // questionId -> title

  formDetails.data.items?.forEach((item) => {
    if (item.questionItem?.question?.questionId && item.title) {
      questionMap.set(item.questionItem.question.questionId, item.title);
    }
  });

  // 2. Fetch responses from Google Forms API
  const responsesResult = await forms.forms.responses.list({
    formId: form.googleFormId,
  });

  const apiResponses = responsesResult.data.responses || [];
  const normalizedResponses: NormalizedResponse[] = [];

  for (const resp of apiResponses) {
    if (!resp.responseId) continue;

    const answersMap: Record<string, string> = {};

    if (resp.answers) {
      Object.entries(resp.answers).forEach(([qId, ansObj]) => {
        const title = questionMap.get(qId) || qId;
        const answerValues = ansObj.textAnswers?.answers?.map((a) => a.value || "").filter(Boolean) || [];
        answersMap[title] = answerValues.join(", ");
      });
    }

    const submittedAt = resp.lastSubmittedTime || new Date().toISOString();
    const respondentEmail = resp.respondentEmail || null;

    // 3. Upsert into database
    await prisma.response.upsert({
      where: { googleResponseId: resp.responseId },
      update: {
        answersJson: JSON.stringify(answersMap),
        respondentEmail,
        submittedAt: new Date(submittedAt),
      },
      create: {
        formId: form.id,
        googleResponseId: resp.responseId,
        respondentEmail,
        answersJson: JSON.stringify(answersMap),
        submittedAt: new Date(submittedAt),
      },
    });

    normalizedResponses.push({
      responseId: resp.responseId,
      submittedAt,
      respondentEmail,
      answers: answersMap,
    });
  }

  return {
    totalFetched: normalizedResponses.length,
    responses: normalizedResponses,
  };
}
