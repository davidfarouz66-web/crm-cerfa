import { prisma } from "@/lib/db";
import { sendCerfaEmail } from "@/lib/email";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { uploadPDF } from "@/lib/storage";
import { generateNumeroCerfa } from "@/lib/utils";

type PaidGalaDonationInput = {
  galaId: string;
  montant: number;
  nomAffiche?: string | null;
  anonyme?: boolean;
  message?: string | null;
  type?: string | null;
  prenom?: string | null;
  nom?: string | null;
  raisonSociale?: string | null;
  siret?: string | null;
  email?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  cerfaDemande?: boolean;
  modePaiement: "stripe" | "gocardless" | "cb" | "sepa" | string;
  stripePaymentId?: string | null;
  gocardlessBillingRequestId?: string | null;
  gocardlessPaymentId?: string | null;
  paymentDate?: Date;
};

const clean = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

function donorType(inputType?: string | null) {
  return inputType === "societe" || inputType === "entreprise" ? "entreprise" : "particulier";
}

function donorDisplayName(input: PaidGalaDonationInput) {
  if (donorType(input.type) === "entreprise") {
    return clean(input.raisonSociale) || clean(input.nomAffiche) || clean(input.nom) || "Donateur";
  }
  return `${clean(input.prenom) || ""} ${clean(input.nom) || ""}`.trim()
    || clean(input.nomAffiche)
    || clean(input.email)?.split("@")[0]
    || "Donateur";
}

async function issueCerfaForGalaDonation(donId: string, input: PaidGalaDonationInput) {
  const gala = await prisma.gala.findUnique({ where: { id: input.galaId } });
  if (!gala) throw new Error("Gala introuvable");

  const association = await prisma.association.findFirst({ where: { tenantId: gala.tenantId } });
  if (!association) throw new Error("Association non configurée");
  if (!association.organismeEligibleMecenat) {
    throw new Error("Association non marquée comme éligible au mécénat");
  }

  const type = donorType(input.type);
  const email = clean(input.email);
  const displayName = donorDisplayName(input);
  const nom = type === "entreprise"
    ? clean(input.raisonSociale) || displayName
    : clean(input.nom) || displayName;

  let donateur = email
    ? await prisma.donateur.findFirst({ where: { tenantId: gala.tenantId, email } })
    : null;

  if (!donateur) {
    donateur = await prisma.donateur.create({
      data: {
        tenantId: gala.tenantId,
        type,
        civilite: "M",
        nom,
        prenom: type === "particulier" ? clean(input.prenom) : null,
        raisonSociale: type === "entreprise" ? clean(input.raisonSociale) || nom : null,
        siretDonateur: type === "entreprise" ? clean(input.siret) : null,
        adresse: clean(input.adresse),
        codePostal: clean(input.codePostal),
        ville: clean(input.ville),
        pays: "France",
        email,
      },
    });
  }

  const dateDon = input.paymentDate || new Date();
  const annee = dateDon.getFullYear();
  const lastForYear = await prisma.cerfa.findFirst({
    where: { numeroCerfa: { startsWith: `A${annee}/` }, tenantId: gala.tenantId },
    orderBy: { numeroCerfa: "desc" },
  });
  let nextSeq = lastForYear ? parseInt(lastForYear.numeroCerfa.split("/")[1], 10) + 1 : 1;
  if (association.cerfaSequence > 0 && nextSeq < association.cerfaSequence) {
    nextSeq = association.cerfaSequence;
  }
  const numeroCerfa = generateNumeroCerfa(annee, nextSeq);

  const pdfData = {
    numeroCerfa,
    donateur,
    dateDon,
    montant: input.montant,
    modePaiement: input.modePaiement,
    objetDon: `Don gala - ${gala.titre}`,
    natureDon: "numeraire",
    formeDon: "declaration_manuel",
    articleFiscal: association.articlesFiscauxAutorises || "200",
    dateEmission: new Date(),
    association,
  };

  const cerfa = await prisma.cerfa.create({
    data: {
      tenantId: gala.tenantId,
      numeroCerfa,
      donateurId: donateur.id,
      dateDon,
      montant: input.montant,
      modePaiement: input.modePaiement,
      objetDon: pdfData.objetDon,
      natureDon: pdfData.natureDon,
      formeDon: pdfData.formeDon,
      articleFiscal: pdfData.articleFiscal,
      dateEmission: pdfData.dateEmission,
    },
  });

  const pdfBytes = type === "entreprise"
    ? await generateMecenaPDF(pdfData)
    : await generateCerfaPDF(pdfData);
  const fileName = `${gala.tenantId}-${numeroCerfa.replace("/", "-")}.pdf`;
  await uploadPDF(fileName, pdfBytes);

  const pdfPath = `/api/pdf/${fileName}`;
  await prisma.cerfa.update({ where: { id: cerfa.id }, data: { pdfPath } });
  await prisma.donGala.update({ where: { id: donId }, data: { cerfaId: cerfa.id, cerfaError: null } });

  if (!email) throw new Error("CERFA généré, mais aucun email donateur n'est disponible");

  await sendCerfaEmail({
    to: email,
    toName: displayName,
    numeroCerfa,
    montant: input.montant,
    dateDon,
    pdfPath,
    associationNom: association.nom,
  });

  await prisma.cerfa.update({ where: { id: cerfa.id }, data: { sentAt: new Date() } });
  await prisma.donGala.update({ where: { id: donId }, data: { cerfaSentAt: new Date(), cerfaError: null } });

  return cerfa;
}

export async function recordPaidGalaDonation(input: PaidGalaDonationInput) {
  const dedupeRefs = [
    input.stripePaymentId ? { stripePaymentId: input.stripePaymentId } : null,
    input.gocardlessBillingRequestId ? { gocardlessBillingRequestId: input.gocardlessBillingRequestId } : null,
    input.gocardlessPaymentId ? { gocardlessPaymentId: input.gocardlessPaymentId } : null,
  ].filter(Boolean) as Array<
    { stripePaymentId: string } |
    { gocardlessBillingRequestId: string } |
    { gocardlessPaymentId: string }
  >;

  if (dedupeRefs.length) {
    const existing = await prisma.donGala.findFirst({
      where: { OR: dedupeRefs },
    });
    if (existing) {
      if (input.cerfaDemande && !existing.cerfaId) {
        try {
          await issueCerfaForGalaDonation(existing.id, input);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[gala cerfa automation retry]", message);
          await prisma.donGala.update({ where: { id: existing.id }, data: { cerfaError: message } }).catch(() => {});
        }
      }
      return prisma.donGala.findUnique({ where: { id: existing.id } });
    }
  }

  const don = await prisma.donGala.create({
    data: {
      galaId: input.galaId,
      montant: input.montant,
      nomAffiche: input.nomAffiche || null,
      anonyme: !!input.anonyme,
      message: input.message || null,
      type: input.type || "particulier",
      prenom: clean(input.prenom),
      nom: clean(input.nom),
      raisonSociale: clean(input.raisonSociale),
      siret: clean(input.siret),
      email: clean(input.email),
      adresse: clean(input.adresse),
      codePostal: clean(input.codePostal),
      ville: clean(input.ville),
      cerfaDemande: !!input.cerfaDemande,
      stripePaymentId: input.stripePaymentId || null,
      gocardlessBillingRequestId: input.gocardlessBillingRequestId || null,
      gocardlessPaymentId: input.gocardlessPaymentId || null,
    },
  });

  await prisma.gala.update({
    where: { id: input.galaId },
    data: { totalCollecte: { increment: input.montant } },
  });

  if (input.cerfaDemande) {
    try {
      await issueCerfaForGalaDonation(don.id, input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[gala cerfa automation]", message);
      await prisma.donGala.update({ where: { id: don.id }, data: { cerfaError: message } }).catch(() => {});
    }
  }

  return prisma.donGala.findUnique({ where: { id: don.id } });
}
