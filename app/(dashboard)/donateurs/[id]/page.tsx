import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FilePlus, Download, Mail, Phone, MapPin, CheckCircle, Clock } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/utils";

const modeLabel: Record<string, string> = {
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  cb: "CB",
};

export default async function DonateurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donateur = await prisma.donateur.findUnique({
    where: { id },
    include: { cerfas: { orderBy: { dateDon: "desc" } } },
  });
  if (!donateur) notFound();

  const totalDons = donateur.cerfas.reduce((s: number, c: { montant: number }) => s + c.montant, 0);
  const nom = donateur.type === "entreprise"
    ? donateur.raisonSociale || donateur.nom
    : `${donateur.prenom || ""} ${donateur.nom}`.trim();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/donateurs" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 flex-1">{nom}</h1>
        <Link href={`/donateurs/${donateur.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Pencil size={14} /> Modifier
        </Link>
        <Link href={`/cerfa/nouveau?donateurId=${donateur.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <FilePlus size={14} /> CERFA
        </Link>
      </div>

      {/* Infos donateur */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
            donateur.type === "entreprise" ? "bg-violet-500" : "bg-blue-500"
          }`}>
            {nom.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {donateur.type === "entreprise" ? "Entreprise" : "Particulier"}
              </span>
            </div>
            {donateur.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-400" />{donateur.email}
              </div>
            )}
            {donateur.telephone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="text-slate-400" />{donateur.telephone}
              </div>
            )}
            {(donateur.adresse || donateur.ville) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                {[donateur.adresse, donateur.codePostal, donateur.ville].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        </div>
        {donateur.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-600">{donateur.notes}</p>
          </div>
        )}
      </div>

      {/* Résumé dons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{donateur.cerfas.length}</p>
          <p className="text-sm text-slate-500 mt-1">CERFA émis</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{formatMontant(totalDons)}</p>
          <p className="text-sm text-slate-500 mt-1">Total des dons</p>
        </div>
      </div>

      {/* Historique CERFA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Historique des CERFA</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {donateur.cerfas.map((c: { id: string; numeroCerfa: string; dateDon: Date; modePaiement: string; montant: number; sentAt: Date | null; pdfPath: string | null }) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-sm text-slate-800">{c.numeroCerfa}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(c.dateDon)} · {modeLabel[c.modePaiement] || c.modePaiement}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-800">{formatMontant(c.montant)}</p>
                {c.sentAt ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle size={11} /> Envoyé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    <Clock size={11} /> Non envoyé
                  </span>
                )}
                {c.pdfPath && (
                  <a href={c.pdfPath} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {donateur.cerfas.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucun CERFA pour ce donateur.
              <br />
              <Link href={`/cerfa/nouveau?donateurId=${donateur.id}`} className="text-blue-600 mt-1 inline-block hover:underline">
                Créer un CERFA →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
