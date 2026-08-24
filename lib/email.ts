import { Resend } from "resend";
import { getSenderEmail } from "./email-from";
import { downloadPDF } from "./storage";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY est requis pour envoyer un reçu fiscal par email.");
  }
  return new Resend(apiKey);
}

export async function sendCerfaEmail({
  to,
  toName,
  numeroCerfa,
  montant,
  dateDon,
  pdfPath,
  associationNom,
}: {
  to: string;
  toName: string;
  numeroCerfa: string;
  montant: number;
  dateDon: Date;
  pdfPath: string;
  associationNom: string;
}) {
  const dateFr = new Date(dateDon).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const montantFr = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant);

  const storageFilename = pdfPath.replace(/^\/api\/pdf\//, "");
  const pdfBytes = await downloadPDF(storageFilename);
  const fileName = `CERFA-${numeroCerfa.replace("/", "-")}.pdf`;

  const { error } = await getResend().emails.send({
    from: getSenderEmail(),
    to: `${toName} <${to}>`,
    subject: `Votre reçu fiscal ${numeroCerfa} — ${associationNom}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1e3a6e;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">${associationNom}</h1>
          <p style="color:#a8c4e8;margin:4px 0 0;font-size:14px">Reçu fiscal de don</p>
        </div>
        <div style="padding:32px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:15px">Madame, Monsieur <strong>${toName}</strong>,</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            Nous vous remercions chaleureusement pour votre don de <strong>${montantFr}</strong>
            effectué le <strong>${dateFr}</strong>.<br>
            Veuillez trouver ci-joint votre reçu fiscal <strong>${numeroCerfa}</strong>,
            établi conformément à l'article 200 du Code général des impôts.
          </p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:16px 20px;margin:20px 0">
            <table style="width:100%;font-size:13px">
              <tr><td style="color:#666;padding:4px 0">N° du reçu</td><td style="font-weight:bold;text-align:right">${numeroCerfa}</td></tr>
              <tr><td style="color:#666;padding:4px 0">Date du don</td><td style="font-weight:bold;text-align:right">${dateFr}</td></tr>
              <tr><td style="color:#666;padding:4px 0">Montant</td><td style="font-weight:bold;text-align:right;color:#1e3a6e;font-size:15px">${montantFr}</td></tr>
            </table>
          </div>
          <p style="font-size:13px;color:#777;line-height:1.6">
            Ce document vous permet de déduire votre don de votre impôt sur le revenu.
            Conservez-le précieusement pour votre déclaration fiscale.
          </p>
          <p style="font-size:14px;margin-top:24px">Cordialement,<br><strong>${associationNom}</strong></p>
        </div>
      </div>
    `,
    attachments: [{
      filename: fileName,
      content: Buffer.from(pdfBytes).toString("base64"),
    }],
  });

  if (error) {
    console.error("[sendCerfaEmail resend error]", error);
    throw new Error(error.message || "Erreur lors de l'envoi de l'email CERFA.");
  }
}
