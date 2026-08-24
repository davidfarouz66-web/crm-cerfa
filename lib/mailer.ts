import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSenderEmail } from "./email-from";

type Attachment = {
  filename: string;
  content: Buffer | string;
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
};

function hasSmtpConfig() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getSmtpPort() {
  return Number(process.env.SMTP_PORT || 465);
}

function getSmtpSecure() {
  const configured = process.env.SMTP_SECURE;
  if (configured) return configured === "true";
  return getSmtpPort() === 465;
}

async function sendWithSmtp(input: SendMailInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure: getSmtpSecure(),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: getSenderEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });
}

async function sendWithResend(input: SendMailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Configurez SMTP OVH ou RESEND_API_KEY pour envoyer des emails.");
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: getSenderEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content.toString("base64")
        : attachment.content,
    })),
  });

  if (error) {
    console.error("[resend email error]", error);
    throw new Error(error.message || "Erreur lors de l'envoi de l'email.");
  }
}

export async function sendMail(input: SendMailInput) {
  if (hasSmtpConfig()) {
    await sendWithSmtp(input);
    return;
  }

  await sendWithResend(input);
}
