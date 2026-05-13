"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/utils";

const modeLabel: Record<string, string> = {
  virement: "Virement bancaire",
  cheque:   "Chèque",
  especes:  "Espèces",
  cb:       "Carte bancaire",
};

interface Cerfa {
  id: string; numeroCerfa: string; dateDon: string; montant: number;
  modePaiement: string; objetDon?: string; dateEmission: string; pdfPath?: string;
  donateurId: string;
  donateur: { nom: string; prenom?: string; raisonSociale?: string; type: string; ville?: string };
}

export default function CerfaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cerfa, setCerfa] = useState<Cerfa | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/cerfa/${id}`).then((r) => {
      if (!r.ok) { router.replace("/cerfa"); return null; }
      return r.json();
    }).then((d) => d && setCerfa(d));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm(`Supprimer le CERFA ${cerfa?.numeroCerfa} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    await fetch(`/api/cerfa/${id}`, { method: "DELETE" });
    router.push("/cerfa");
  };

  if (!cerfa) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nom = cerfa.donateur.type === "entreprise"
    ? cerfa.donateur.raisonSociale || cerfa.donateur.nom
    : `${cerfa.donateur.prenom || ""} ${cerfa.donateur.nom}`.trim();

  const fields = [
    { label: "N° CERFA",         value: cerfa.numeroCerfa },
    { label: "Date du don",      value: formatDate(cerfa.dateDon) },
    { label: "Montant",          value: formatMontant(cerfa.montant), highlight: true },
    { label: "Mode de paiement", value: modeLabel[cerfa.modePaiement] || cerfa.modePaiement },
    { label: "Objet du don",     value: cerfa.objetDon || "—" },
    { label: "Date d'émission",  value: formatDate(cerfa.dateEmission) },
  ];

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cerfa" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{cerfa.numeroCerfa}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Reçu fiscal</p>
        </div>
        <div className="flex items-center gap-2">
          {cerfa.pdfPath && (
            <a href={cerfa.pdfPath} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Download size={15} />
              <span className="hidden sm:inline">PDF</span>
            </a>
          )}
          <Link href={`/cerfa/${id}/edit`}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            <Pencil size={15} />
            <span className="hidden sm:inline">Modifier</span>
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            <span className="hidden sm:inline">Supprimer</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center gap-3 mb-1">
          <User size={16} className="text-slate-400" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Donateur</p>
        </div>
        <Link href={`/donateurs/${cerfa.donateurId}`}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
          {nom}
        </Link>
        <p className="text-sm text-slate-500 mt-0.5">
          {cerfa.donateur.type === "entreprise" ? "Entreprise" : "Particulier"}
          {cerfa.donateur.ville ? ` · ${cerfa.donateur.ville}` : ""}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-slate-500">{f.label}</span>
            <span className={`text-sm font-semibold ${f.highlight ? "text-blue-600 text-base" : "text-slate-800"}`}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
