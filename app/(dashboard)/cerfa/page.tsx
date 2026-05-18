"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FilePlus, Download, ChevronRight, CheckCircle, Clock, Ban } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/utils";

interface Cerfa {
  id: string;
  numeroCerfa: string;
  montant: number;
  dateDon: string;
  modePaiement: string;
  pdfPath?: string;
  sentAt?: string | null;
  status: string;
  donateur: { nom: string; prenom?: string; raisonSociale?: string; type: string };
}

const modeLabel: Record<string, string> = {
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  cb: "CB",
};

export default function CerfaListPage() {
  const [cerfas, setCerfas] = useState<Cerfa[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/cerfa?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => { setCerfas(d); setLoading(false); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  const getNom = (d: Cerfa["donateur"]) =>
    d.type === "entreprise" ? d.raisonSociale || d.nom : `${d.prenom || ""} ${d.nom}`.trim();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Liste des CERFA</h1>
          <p className="text-slate-500 text-sm mt-0.5">{cerfas.length} reçu(s)</p>
        </div>
        <Link href="/cerfa/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <FilePlus size={16} />
          <span>Nouveau</span>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par n° CERFA, nom..."
          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {cerfas.map((c) => (
            <div key={c.id} className={`flex items-center justify-between p-3 md:p-4 ${c.status === "annulé" ? "opacity-50" : ""}`}>
              <Link href={`/cerfa/${c.id}`} className="flex-1 flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${c.status === "annulé" ? "bg-red-50" : "bg-blue-50"}`}>
                  {c.status === "annulé"
                    ? <Ban size={14} className="text-red-400" />
                    : <span className="text-blue-600 text-xs font-bold">PDF</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${c.status === "annulé" ? "text-slate-400 line-through" : "text-slate-800"}`}>{c.numeroCerfa}</p>
                  <p className="text-xs text-slate-500 truncate">{getNom(c.donateur)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatMontant(c.montant)} · {modeLabel[c.modePaiement]}</p>
                </div>
              </Link>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {c.status === "annulé" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    <Ban size={11} /> Annulé
                  </span>
                ) : c.sentAt ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle size={11} /> Envoyé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                    <Clock size={11} /> En attente
                  </span>
                )}
                {c.pdfPath && (
                  <a href={c.pdfPath} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Download size={14} />
                  </a>
                )}
                <Link href={`/cerfa/${c.id}`} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
          {cerfas.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <p className="mb-2">Aucun CERFA trouvé</p>
              <Link href="/cerfa/nouveau" className="text-blue-600 text-sm hover:underline">
                Créer le premier CERFA →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
