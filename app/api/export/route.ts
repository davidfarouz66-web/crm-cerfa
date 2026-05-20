export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
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

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `CERFA ${annee}`);
  ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }];

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="CERFA-${annee}.xlsx"`,
    },
  });
}
