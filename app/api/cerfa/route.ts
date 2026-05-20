export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateNumeroCerfa } from "@/lib/utils";
import { generateCerfaPDF } from "@/lib/pdf";
import { generateMecenaPDF } from "@/lib/pdf-mecena";
import { uploadPDF } from "@/lib/storage";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const { searchParams } = new URL(req.url);
  const q       = searchParams.get("q") || "";
  const annee   = searchParams.get("annee");
  const page    = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit   = parseInt(searchParams.get("limit") || "20", 10);
  const skip    = (page - 1) * limit;
  const noLimit = limit === 0;

  const where = {
    tenantId: t.tenantId,
    ...(q && {
      OR: [
        { numeroCerfa: { contains: q } },
        { donateur: { nom: { contains: q } } },
        { donateur: { prenom: { contains: q } } },
      ],
    }),
    ...(annee && {
      dateDon: {
        gte: new Date(`${annee}-01-01`),
        lte: new Date(`${annee}-12-31`),
      },
    }),
  };

  if (noLimit) {
    const cerfas = await prisma.cerfa.findMany({
      where, include: { donateur: true }, orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cerfas);
  }

  const [cerfas, total] = await Promise.all([
    prisma.cerfa.findMany({
      where, include: { donateur: true }, orderBy: { createdAt: "desc" }, skip, take: limit,
    }),
    prisma.cerfa.count({ where }),
  ]);

  return NextResponse.json({ data: cerfas, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const t = await requireTenant();
  if (t instanceof NextResponse) return t;

  const body = await req.json();
  const session = await getServerSession(authOptions);

  const annee = new Date(body.dateDon).getFullYear();

  const association = await prisma.association.findFirst({ where: { tenantId: t.tenantId } });
  if (!association) {
    return NextResponse.json({ error: "Association non configurée" }, { status: 400 });
  }

  if (!association.organismeEligibleMecenat) {
    return NextResponse.json({
      error: "L'association n'est pas marquée comme éligible au mécénat. Vérifiez les paramètres association.",
      code: "NOT_ELIGIBLE",
    }, { status: 400 });
  }

  const dateEmission = body.dateEmission ? new Date(body.dateEmission) : new Date();
  const dernierCerfa = await prisma.cerfa.findFirst({
    where: { status: "actif", tenantId: t.tenantId },
    orderBy: { dateEmission: "desc" },
  });
  if (dernierCerfa && dateEmission < dernierCerfa.dateEmission) {
    if (!body.derogationMotif?.trim()) {
      return NextResponse.json({
        code: "NOT_CHRONOLOGICAL",
        error: "Date d'émission antérieure au dernier reçu actif.",
        dernierNumero: dernierCerfa.numeroCerfa,
        dernierDate: dernierCerfa.dateEmission.toLocaleDateString("fr-FR"),
      }, { status: 400 });
    }
    await prisma.auditLog.create({
      data: {
        userId: (session?.user as { id?: string })?.id ?? null,
        action: "DEROGATION_CHRONOLOGIQUE",
        entityType: "Cerfa",
        entityId: dernierCerfa.id,
        newValues: JSON.stringify({
          dateEmissionDemandee: dateEmission.toISOString(),
          dernierCerfa: dernierCerfa.numeroCerfa,
          motif: body.derogationMotif,
        }),
      },
    }).catch(() => {});
  }

  const lastForYear = await prisma.cerfa.findFirst({
    where: { numeroCerfa: { startsWith: `A${annee}/` }, tenantId: t.tenantId },
    orderBy: { numeroCerfa: "desc" },
  });
  let nextSeq = 1;
  if (lastForYear) {
    const parts = lastForYear.numeroCerfa.split("/");
    nextSeq = parseInt(parts[1], 10) + 1;
  }
  if (association.cerfaSequence > 0 && nextSeq < association.cerfaSequence) {
    nextSeq = association.cerfaSequence;
  }
  const numeroCerfa = generateNumeroCerfa(annee, nextSeq);

  const donateur = await prisma.donateur.findFirst({
    where: { id: body.donateurId, tenantId: t.tenantId },
  });
  if (!donateur) {
    return NextResponse.json({ error: "Donateur introuvable" }, { status: 404 });
  }

  const cerfa = await prisma.cerfa.create({
    data: {
      tenantId:      t.tenantId,
      numeroCerfa,
      donateurId:    body.donateurId,
      dateDon:       new Date(body.dateDon),
      montant:       parseFloat(body.montant),
      modePaiement:  body.modePaiement,
      objetDon:      body.objetDon || null,
      natureDon:     body.natureDon || "numeraire",
      formeDon:      body.formeDon || "declaration_manuel",
      articleFiscal: body.articleFiscal || association.articlesFiscauxAutorises || "200",
      dateEmission,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (session?.user as { id?: string })?.id ?? null,
      action: "CREATE_CERFA",
      entityType: "Cerfa",
      entityId: cerfa.id,
      newValues: JSON.stringify({ numeroCerfa, montant: cerfa.montant, donateurId: cerfa.donateurId }),
    },
  }).catch(() => {});

  const pdfData = {
    numeroCerfa,
    donateur,
    dateDon:      new Date(body.dateDon),
    montant:      parseFloat(body.montant),
    modePaiement: body.modePaiement,
    objetDon:     body.objetDon || null,
    natureDon:    body.natureDon || "numeraire",
    formeDon:     body.formeDon || "declaration_manuel",
    articleFiscal: body.articleFiscal || association.articlesFiscauxAutorises || "200",
    dateEmission,
    association,
  };
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = donateur.type === "entreprise"
      ? await generateMecenaPDF(pdfData)
      : await generateCerfaPDF(pdfData);
  } catch (pdfErr) {
    console.error("[PDF generation error]", pdfErr);
    return NextResponse.json({ error: `Erreur génération PDF: ${String(pdfErr)}` }, { status: 500 });
  }

  const fileName = `${t.tenantId}-${numeroCerfa.replace("/", "-")}.pdf`;
  await uploadPDF(fileName, pdfBytes);

  const updatedCerfa = await prisma.cerfa.update({
    where: { id: cerfa.id },
    data: { pdfPath: `/api/pdf/${fileName}` },
    include: { donateur: true },
  });

  return NextResponse.json(updatedCerfa, { status: 201 });
}
