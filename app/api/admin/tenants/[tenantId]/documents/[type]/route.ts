export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { downloadPrivateDocument } from "@/lib/storage";

const DOCUMENTS = {
  statuts: ["documentStatutsPath", "documentStatutsNom", "documentStatutsMime"],
  immatriculation: ["documentImmatriculationPath", "documentImmatriculationNom", "documentImmatriculationMime"],
  eligibilite: ["documentEligibilitePath", "documentEligibiliteNom", "documentEligibiliteMime"],
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string; type: string }> },
) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "superadmin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { tenantId, type } = await params;
  if (!(type in DOCUMENTS)) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }
  const association = await prisma.association.findFirst({ where: { tenantId } });
  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const [pathKey, nameKey, mimeKey] = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const path = association[pathKey];
  const name = association[nameKey];
  const mime = association[mimeKey];
  if (!path) return NextResponse.json({ error: "Document absent" }, { status: 404 });

  try {
    const bytes = await downloadPrivateDocument(path);
    const safeName = (name || "justificatif").replace(/["\r\n]/g, "_");
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": mime || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[admin document]", error);
    return NextResponse.json({ error: "Document indisponible" }, { status: 502 });
  }
}
