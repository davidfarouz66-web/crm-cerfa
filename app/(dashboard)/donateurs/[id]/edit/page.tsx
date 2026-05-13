import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import DonateurForm from "@/components/forms/DonateurForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditDonateurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donateur = await prisma.donateur.findUnique({ where: { id } });
  if (!donateur) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/donateurs/${id}`} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Modifier le donateur</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {donateur.type === "entreprise" ? donateur.raisonSociale : `${donateur.prenom || ""} ${donateur.nom}`.trim()}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <DonateurForm mode="edit" initial={{
          id: donateur.id,
          type: donateur.type,
          nom: donateur.nom,
          prenom: donateur.prenom ?? undefined,
          raisonSociale: donateur.raisonSociale ?? undefined,
          adresse: donateur.adresse ?? undefined,
          codePostal: donateur.codePostal ?? undefined,
          ville: donateur.ville ?? undefined,
          email: donateur.email ?? undefined,
          telephone: donateur.telephone ?? undefined,
          notes: donateur.notes ?? undefined,
        }} />
      </div>
    </div>
  );
}
