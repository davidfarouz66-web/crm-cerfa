import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { deletePrivateDocuments, uploadPrivateDocument } from "@/lib/storage";
const createId = () => randomBytes(12).toString("hex");

const ALLOWED_DOCUMENTS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_TOTAL_FILE_SIZE = 4 * 1024 * 1024;
const RESCRIT_STATUSES = new Set(["non_demande", "en_cours", "favorable"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function documentFile(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validateFile(file: File | null, label: string, required: boolean) {
  if (!file) {
    if (required) throw new Error(`${label} est obligatoire.`);
    return;
  }
  if (!ALLOWED_DOCUMENTS[file.type]) {
    throw new Error(`${label} doit être au format PDF, JPG ou PNG.`);
  }
}

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`register:${requestIp(req.headers)}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Trop de créations de compte. Réessayez plus tard." }, {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }
    const form = await req.formData();
    const nomAssociation = text(form, "nomAssociation");
    const email = text(form, "email");
    const password = text(form, "password");
    const telephone = text(form, "telephone");
    const adresse = text(form, "adresse");
    const codePostal = text(form, "codePostal");
    const ville = text(form, "ville");
    const rna = text(form, "rna").toUpperCase().replace(/\s/g, "");
    const siret = normalizeDigits(text(form, "siret"));
    const objetSocial = text(form, "objetSocial");
    const publicBeneficiaire = text(form, "publicBeneficiaire");
    const typeOrganisme = text(form, "typeOrganisme");
    const responsableLegalNom = text(form, "responsableLegalNom");
    const responsableLegalFonction = text(form, "responsableLegalFonction");
    const rescritFiscalStatut = text(form, "rescritFiscalStatut");
    const attestationExactitude = text(form, "attestationExactitude") === "true";
    const attestationResponsabilite = text(form, "attestationResponsabilite") === "true";
    const statuts = documentFile(form, "documentStatuts");
    const immatriculation = documentFile(form, "documentImmatriculation");
    const eligibilite = documentFile(form, "documentEligibilite");

    if (!nomAssociation || !email || !password || !telephone || !adresse || !codePostal || !ville ||
        !objetSocial || !publicBeneficiaire || !typeOrganisme || !responsableLegalNom ||
        !responsableLegalFonction || !rescritFiscalStatut) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être complétés." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "L’adresse email n’est pas valide." }, { status: 400 });
    }
    if (objetSocial.length < 80) {
      return NextResponse.json({ error: "L’objet social doit comporter au moins 80 caractères." }, { status: 400 });
    }
    if (!RESCRIT_STATUSES.has(rescritFiscalStatut)) {
      return NextResponse.json({ error: "Le statut du rescrit mécénat est invalide." }, { status: 400 });
    }
    if (!rna && !siret) {
      return NextResponse.json({ error: "Indiquez au moins un numéro RNA ou SIRET." }, { status: 400 });
    }
    if (rna && !/^W\d{9}$/.test(rna)) {
      return NextResponse.json({ error: "Le numéro RNA doit être composé de W suivi de 9 chiffres." }, { status: 400 });
    }
    if (siret && siret.length !== 14) {
      return NextResponse.json({ error: "Le numéro SIRET doit contenir 14 chiffres." }, { status: 400 });
    }
    if (!attestationExactitude || !attestationResponsabilite) {
      return NextResponse.json({ error: "Les deux attestations doivent être acceptées." }, { status: 400 });
    }

    try {
      validateFile(statuts, "Les statuts signés", true);
      validateFile(immatriculation, "Le justificatif RNA ou SIRENE", true);
      validateFile(eligibilite, "Le justificatif d'éligibilité", rescritFiscalStatut === "favorable");
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Justificatif invalide." }, { status: 400 });
    }
    const files = [statuts, immatriculation, eligibilite].filter((file): file is File => !!file);
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_FILE_SIZE) {
      return NextResponse.json({ error: "La taille totale des justificatifs ne doit pas dépasser 4 Mo." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 409 });
    }

    // Génère un tenantId unique pour cette association
    const tenantId = createId();
    const hash = await bcrypt.hash(password, 10);
    const uploadedPaths: string[] = [];

    async function upload(file: File | null, kind: string) {
      if (!file) return null;
      const path = `inscriptions/${tenantId}/${kind}-${createId()}.${ALLOWED_DOCUMENTS[file.type]}`;
      await uploadPrivateDocument(path, Buffer.from(await file.arrayBuffer()), file.type);
      uploadedPaths.push(path);
      return { path, nom: file.name.slice(0, 180), mime: file.type };
    }

    try {
      const statutsDoc = await upload(statuts, "statuts");
      const immatriculationDoc = await upload(immatriculation, "immatriculation");
      const eligibiliteDoc = await upload(eligibilite, "eligibilite");

      await prisma.$transaction([
        prisma.user.create({
          data: { email: normalizedEmail, password: hash, name: nomAssociation, role: "admin", status: "pending", tenantId },
        }),
        prisma.association.create({
          data: {
            nom: nomAssociation,
            email: normalizedEmail,
            telephone,
            adresse,
            codePostal,
            ville,
            rna: rna || null,
            siret: siret || null,
            objetSocial,
            publicBeneficiaire,
            typeOrganisme,
            responsableLegalNom,
            responsableLegalFonction,
            representant: `${responsableLegalNom} — ${responsableLegalFonction}`,
            rescritFiscalStatut,
            dossierCerfaSoumisAt: new Date(),
            attestationExactitude,
            attestationResponsabilite,
            organismeEligibleMecenat: false,
            documentStatutsPath: statutsDoc?.path,
            documentStatutsNom: statutsDoc?.nom,
            documentStatutsMime: statutsDoc?.mime,
            documentImmatriculationPath: immatriculationDoc?.path,
            documentImmatriculationNom: immatriculationDoc?.nom,
            documentImmatriculationMime: immatriculationDoc?.mime,
            documentEligibilitePath: eligibiliteDoc?.path,
            documentEligibiliteNom: eligibiliteDoc?.nom,
            documentEligibiliteMime: eligibiliteDoc?.mime,
            tenantId,
          },
        }),
      ]);
    } catch (error) {
      await deletePrivateDocuments(uploadedPaths);
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Impossible de créer le compte." }, { status: 500 });
  }
}
