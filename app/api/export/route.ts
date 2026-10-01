export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { formatDate, formatMontant } from "@/lib/utils";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { searchParams } = new URL(req.url);
  const annee = searchParams.get("annee") || new Date().getFullYear().toString();

  const cerfas = await prisma.cerfa.findMany({
    where: {
      tenantId: t.tenantId,
      dateDon: {
        gte: new Date(`${annee}-01-01`),
        lte: new Date(`${annee}-12-31`),
      },
    },
    include: { donateur: true },
    orderBy: { dateDon: "asc" },
  });

  const rows = cerfas.map((c) => ({
    "N° CERFA":          c.numeroCerfa,
    "Donateur":          c.donateur.type === "entreprise"
      ? c.donateur.raisonSociale || c.donateur.nom
      : `${c.donateur.prenom || ""} ${c.donateur.nom}`.trim(),
    "Type":              c.donateur.type,
    "Date du don":       formatDate(c.dateDon),
    "Montant":           c.montant,
    "Mode de paiement":  c.modePaiement,
    "Objet":             c.objetDon || "",
    "Date d'émission":   formatDate(c.dateEmission),
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`CERFA ${annee}`);
  worksheet.columns = [
    { header: "N° CERFA", key: "N° CERFA", width: 20 },
    { header: "Donateur", key: "Donateur", width: 30 },
    { header: "Type", key: "Type", width: 15 },
    { header: "Date du don", key: "Date du don", width: 15 },
    { header: "Montant", key: "Montant", width: 12 },
    { header: "Mode de paiement", key: "Mode de paiement", width: 20 },
    { header: "Objet", key: "Objet", width: 25 },
    { header: "Date d'émission", key: "Date d'émission", width: 15 },
  ];
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="CERFA-${annee}.xlsx"`,
    },
  });
}
