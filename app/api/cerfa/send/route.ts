export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSenderEmail } from "@/lib/email-from";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY est requis pour envoyer un reçu fiscal par email.");
  }
  return new Resend(apiKey);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { cerfaId } = await req.json();
  if (!cerfaId) return NextResponse.json({ error: "cerfaId manquant" }, { status: 400 });

  const cerfa = await prisma.cerfa.findUnique({
    where: { id: cerfaId },
    include: { donateur: true },
  });
  if (!cerfa) return NextResponse.json({ error: "CERFA introuvable" }, { status: 404 });

  const email = cerfa.donateur.email;
  if (!email) return NextResponse.json({ error: "Le donateur n'a pas d'adresse email." }, { status: 400 });

  const association = await prisma.association.findFirst();
  if (!association) return NextResponse.json({ error: "Association non configurée" }, { status: 400 });

  const pdfData = {
    numeroCerfa: cerfa.numeroCerfa,
    donateur: cerfa.donateur,
    dateDon: cerfa.dateDon,
    montant: cerfa.montant,
    modePaiement: cerfa.modePaiement,
    objetDon: cerfa.objetDon,
    dateEmission: cerfa.dateEmission,
    association,
    natureDon: cerfa.natureDon,
    formeDon: cerfa.formeDon,
    articleFiscal: cerfa.articleFiscal,
  };

  const pdfBytes = cerfa.donateur.type === "entreprise"
    ? await generateMecenaPDF(pdfData)
    : await generateCerfaPDF(pdfData);

  const nomDonateur = cerfa.donateur.type === "entreprise"
    ? cerfa.donateur.raisonSociale || cerfa.donateur.nom
    : `${cerfa.donateur.prenom || ""} ${cerfa.donateur.nom}`.trim();

  const montantStr = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cerfa.montant);

  const { error } = await getResend().emails.send({
    from: getSenderEmail(),
    to: email,
    subject: `Votre reçu fiscal n° ${cerfa.numeroCerfa} — ${association.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #1e3a8a; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Trouma Pro</h1>
          <p style="color: #93c5fd; margin: 4px 0 0; font-size: 13px;">Gestion des dons et reçus fiscaux</p>
        </div>
        <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">Bonjour <strong>${nomDonateur}</strong>,</p>
          <p style="margin: 0 0 24px; color: #475569;">
            Veuillez trouver ci-joint votre reçu fiscal n° <strong>${cerfa.numeroCerfa}</strong>
            émis par <strong>${association.nom}</strong> pour un don de <strong>${montantStr}</strong>.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Récapitulatif du don</p>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748b;">Association</td><td style="padding: 4px 0; font-weight: 600; text-align: right;">${association.nom}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Montant</td><td style="padding: 4px 0; font-weight: 600; text-align: right; color: #1d4ed8;">${montantStr}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">N° reçu</td><td style="padding: 4px 0; font-weight: 600; text-align: right;">${cerfa.numeroCerfa}</td></tr>
            </table>
          </div>
          <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
            Ce reçu fiscal vous permet de déduire votre don de vos impôts conformément aux articles 200, 238 bis ou 978 du CGI.
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Ce message vous est transmis par <strong>Trouma Pro</strong> pour le compte de ${association.nom}.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `CERFA-${cerfa.numeroCerfa.replace("/", "-")}.pdf`,
        content: Buffer.from(pdfBytes),
      },
    ],
  });

  if (error) {
    console.error("[resend error]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email." }, { status: 500 });
  }

  await prisma.cerfa.update({
    where: { id: cerfaId },
    data: { sentAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
