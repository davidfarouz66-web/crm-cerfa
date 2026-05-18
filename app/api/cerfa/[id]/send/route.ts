import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendCerfaEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { email } = await req.json();

    const cerfa = await prisma.cerfa.findUnique({
      where: { id },
      include: { donateur: true },
    });
    if (!cerfa) return NextResponse.json({ error: "CERFA introuvable" }, { status: 404 });
    if (!cerfa.pdfPath) return NextResponse.json({ error: "PDF non généré" }, { status: 400 });

    const association = await prisma.association.findFirst();
    if (!association) return NextResponse.json({ error: "Association non configurée" }, { status: 400 });

    const toEmail = email || cerfa.donateur.email;
    if (!toEmail) return NextResponse.json({ error: "Aucune adresse email pour ce donateur" }, { status: 400 });

    const toName = cerfa.donateur.type === "entreprise"
      ? cerfa.donateur.raisonSociale || cerfa.donateur.nom
      : `${cerfa.donateur.prenom || ""} ${cerfa.donateur.nom}`.trim();

    await sendCerfaEmail({
      to:             toEmail,
      toName,
      numeroCerfa:    cerfa.numeroCerfa,
      montant:        cerfa.montant,
      dateDon:        cerfa.dateDon,
      pdfPath:        cerfa.pdfPath,
      associationNom: association.nom,
    });

    await prisma.cerfa.update({ where: { id }, data: { sentAt: new Date() } });

    return NextResponse.json({ ok: true, sentTo: toEmail });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
