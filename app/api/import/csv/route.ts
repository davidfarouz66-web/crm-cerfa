import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNumeroCerfa } from "@/lib/utils";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

const MODES_VALIDES = ["virement", "cheque", "especes", "cb"];

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);

  const created: { numeroCerfa: string; donateur: string; montant: number }[] = [];
  const errors: { row: number; message: string }[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    // Validation des champs obligatoires
    if (!row.nom) { errors.push({ row: rowNum, message: "Champ 'nom' manquant" }); continue; }
    if (!row.montant || isNaN(parseFloat(row.montant))) { errors.push({ row: rowNum, message: "Champ 'montant' invalide" }); continue; }
    if (!row.date_don || isNaN(Date.parse(row.date_don))) { errors.push({ row: rowNum, message: "Champ 'date_don' invalide (format attendu : AAAA-MM-JJ)" }); continue; }
    if (!row.mode_paiement || !MODES_VALIDES.includes(row.mode_paiement)) {
      errors.push({ row: rowNum, message: `Mode de paiement invalide (valeurs : ${MODES_VALIDES.join(", ")})` }); continue;
    }

    // Si un numéro CERFA est fourni, vérifier qu'il n'existe pas déjà
    if (row.numero_cerfa) {
      const existing = await prisma.cerfa.findUnique({ where: { numeroCerfa: row.numero_cerfa } });
      if (existing) { skipped++; continue; }
    }

    // Trouver ou créer le donateur
    const type = row.type === "entreprise" ? "entreprise" : "particulier";
    let donateur = null;

    if (row.email) {
      donateur = await prisma.donateur.findFirst({ where: { email: row.email } });
    }
    if (!donateur) {
      donateur = await prisma.donateur.findFirst({
        where: { nom: row.nom, prenom: row.prenom || null },
      });
    }
    if (!donateur) {
      donateur = await prisma.donateur.create({
        data: {
          type,
          nom: row.nom,
          prenom: row.prenom || null,
          raisonSociale: type === "entreprise" ? row.nom : null,
          email: row.email || null,
          adresse: row.adresse || null,
          codePostal: row.code_postal || null,
          ville: row.ville || null,
        },
      });
    }

    // Générer le numéro CERFA si absent
    let numeroCerfa = row.numero_cerfa || "";
    if (!numeroCerfa) {
      const annee = new Date(row.date_don).getFullYear();
      const count = await prisma.cerfa.count({
        where: { dateDon: { gte: new Date(`${annee}-01-01`), lte: new Date(`${annee}-12-31`) } },
      });
      numeroCerfa = generateNumeroCerfa(annee, count + 1);
    }

    await prisma.cerfa.create({
      data: {
        numeroCerfa,
        donateurId: donateur.id,
        dateDon: new Date(row.date_don),
        montant: parseFloat(row.montant),
        modePaiement: row.mode_paiement,
        dateEmission: new Date(),
      },
    });

    const nomAffiche = type === "entreprise"
      ? row.nom
      : `${row.prenom || ""} ${row.nom}`.trim();

    created.push({ numeroCerfa, donateur: nomAffiche, montant: parseFloat(row.montant) });
  }

  return NextResponse.json({ created: created.length, skipped, errors, details: created });
}
