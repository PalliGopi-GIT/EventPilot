import { google, forms_v1 } from "googleapis";
import type { FormDefinition, QuestionDefinition } from "../ai/schemas";
import { getAuthenticatedClientForUser } from "./oauth";

/**
 * Maps our QuestionDefinition to Google Forms API batchUpdate request format.
 */
function mapQuestionToGoogleFormItem(
  q: QuestionDefinition,
  index: number
): forms_v1.Schema$Request {
  const item: forms_v1.Schema$Item = {
    title: q.label,
    questionItem: {
      question: {
        required: q.required,
      },
    },
  };

  switch (q.type) {
    case "short_answer":
      item.questionItem!.question!.textQuestion = {
        paragraph: false,
      };
      break;

    case "paragraph":
      item.questionItem!.question!.textQuestion = {
        paragraph: true,
      };
      break;

    case "multiple_choice":
      item.questionItem!.question!.choiceQuestion = {
        type: "RADIO",
        options: (q.options && q.options.length > 0 ? q.options : ["Option 1", "Option 2"]).map(
          (opt) => ({ value: opt })
        ),
        shuffle: false,
      };
      break;

    case "checkbox":
      item.questionItem!.question!.choiceQuestion = {
        type: "CHECKBOX",
        options: (q.options && q.options.length > 0 ? q.options : ["Option 1", "Option 2"]).map(
          (opt) => ({ value: opt })
        ),
      };
      break;

    case "dropdown":
      item.questionItem!.question!.choiceQuestion = {
        type: "DROP_DOWN",
        options: (q.options && q.options.length > 0 ? q.options : ["Option 1", "Option 2"]).map(
          (opt) => ({ value: opt })
        ),
      };
      break;

    case "linear_scale":
      item.questionItem!.question!.scaleQuestion = {
        low: q.scaleMin ?? 1,
        high: q.scaleMax ?? 5,
        lowLabel: q.scaleLowLabel || "Poor",
        highLabel: q.scaleHighLabel || "Excellent",
      };
      break;

    default:
      item.questionItem!.question!.textQuestion = {
        paragraph: false,
      };
  }

  return {
    createItem: {
      item,
      location: {
        index,
      },
    },
  };
}

export interface GoogleFormCreationResult {
  googleFormId: string;
  formUrl: string;
  responderUri: string;
  title: string;
  questionCount: number;
}

/**
 * Creates a real Google Form in the authenticated user's Google Drive.
 */
export async function createRealGoogleForm(
  userId: string,
  formDef: FormDefinition
): Promise<GoogleFormCreationResult> {
  const { oauth2Client, googleEmail } = await getAuthenticatedClientForUser(userId);
  const forms = google.forms({ version: "v1", auth: oauth2Client });

  // 1. Create the initial empty form with title
  const createResponse = await forms.forms.create({
    requestBody: {
      info: {
        title: formDef.title,
        documentTitle: formDef.title,
      },
    },
  });

  const formId = createResponse.data.formId;
  if (!formId) {
    throw new Error("Failed to obtain formId from Google Forms API create response");
  }

  // 2. Prepare batchUpdate requests
  const requests: forms_v1.Schema$Request[] = [];

  // Update description if present
  if (formDef.description) {
    requests.push({
      updateFormInfo: {
        info: {
          description: formDef.description,
        },
        updateMask: "description",
      },
    });
  }

  // Add all questions in sequential order
  formDef.questions.forEach((q, idx) => {
    requests.push(mapQuestionToGoogleFormItem(q, idx));
  });

  // 3. Execute batchUpdate
  if (requests.length > 0) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: {
        requests,
      },
    });
  }

  // 4. Retrieve complete created form metadata
  const fullForm = await forms.forms.get({ formId });

  const responderUri =
    fullForm.data.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const formUrl = `https://docs.google.com/forms/d/${formId}/edit`;

  return {
    googleFormId: formId,
    formUrl,
    responderUri,
    title: fullForm.data.info?.title || formDef.title,
    questionCount: formDef.questions.length,
  };
}
