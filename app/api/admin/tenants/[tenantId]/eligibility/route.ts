export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ARTICLES = new Set(["200", "238bis", "978", "200,238bis", "200,238bis,978"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "superadmin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { tenantId } = await params;
  const body = await request.json();
  if (typeof body.eligible !== "boolean") {
    return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
  }
  const commentaire = typeof body.commentaire === "string" ? body.commentaire.trim().slice(0, 1000) : "";
  const articles = typeof body.articlesFiscauxAutorises === "string" ? body.articlesFiscauxAutorises : "200";
  if (!ARTICLES.has(articles)) {
    return NextResponse.json({ error: "Articles fiscaux invalides" }, { status: 400 });
  }

  const association = await prisma.association.findFirst({ where: { tenantId } });
  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
  if (body.eligible && (
    !association.dossierCerfaSoumisAt ||
    !association.attestationExactitude ||
    !association.attestationResponsabilite ||
    !association.documentStatutsPath ||
    !association.documentImmatriculationPath
  )) {
    return NextResponse.json({ error: "Le dossier est incomplet et ne peut pas être validé." }, { status: 400 });
  }

  const updated = await prisma.association.update({
    where: { id: association.id },
    data: {
      organismeEligibleMecenat: body.eligible,
      articlesFiscauxAutorises: articles,
      commentaireEligibilite: commentaire || (body.eligible ? "Dossier vérifié par Trouma Pro." : "Dossier non validé par Trouma Pro."),
      dateVerificationEligibilite: new Date(),
    },
    select: {
      organismeEligibleMecenat: true,
      articlesFiscauxAutorises: true,
      commentaireEligibilite: true,
      dateVerificationEligibilite: true,
    },
  });

  return NextResponse.json(updated);
}
