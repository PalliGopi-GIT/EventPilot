import { Resend } from "resend";
import { recordAuditLog } from "../auth/session";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFormEmail(options: {
  to: string | string[];
  subject: string;
  responderUri: string;
  formTitle: string;
}) {
  const toArray = Array.isArray(options.to) ? options.to : [options.to];
  const html = `<p>Please fill out this form: <strong>${options.formTitle}</strong></p><p><a href="${options.responderUri}">${options.responderUri}</a></p>`;

  await Promise.all(
    toArray.map(async (email) => {
      await resend.emails.send({
        from: "EventPilot <onboarding@resend.dev>",
        to: email,
        subject: options.subject,
        html,
      });
    })
  );

  await recordAuditLog({
    action: "FORM_EMAIL_SENT",
    resourceType: "form",
    details: {
      recipients: toArray,
      subject: options.subject,
      formTitle: options.formTitle,
    },
  });
}
