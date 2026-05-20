"use client";

import { useEffect, useState } from "react";
import { Download, Filter, AlertTriangle } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/utils";

interface Cerfa {
  id: string;
  numeroCerfa: string;
  montant: number;
  dateDon: string;
  modePaiement: string;
  objetDon?: string;
  pdfPath?: string;
  donateur: { nom: string; prenom?: string; raisonSociale?: string; type: string };
}

const modeLabel: Record<string, string> = {
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  cb: "CB",
};

export default function RecapitulatifPage() {
  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState(currentYear.toString());
  const [cerfas, setCerfas] = useState<Cerfa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cerfa?annee=${annee}&limit=0`)
      .then((r) => r.json())
      .then((d) => { setCerfas(d); setLoading(false); });
  }, [annee]);

  const filtered = filterMode ? cerfas.filter((c) => c.modePaiement === filterMode) : cerfas;
  const total = filtered.reduce((s, c) => s + c.montant, 0);

  const getNom = (d: Cerfa["donateur"]) =>
    d.type === "entreprise" ? d.raisonSociale || d.nom : `${d.prenom || ""} ${d.nom}`.trim();

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Récapitulatif</h1>
          <p className="text-slate-500 text-sm mt-0.5">Vue d&apos;ensemble {annee}</p>
        </div>
        <a href={`/api/export?annee=${annee}`}
          className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Download size={16} />
          <span className="hidden sm:inline">Export Excel</span>
        </a>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        <select value={annee} onChange={(e) => setAnnee(e.target.value)}
          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous modes</option>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="especes">Espèces</option>
          <option value="cb">CB</option>
        </select>
      </div>

      {/* Avertissement */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 flex gap-2">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">À vérifier avant déclaration sur impots.gouv.fr — ces données sont indicatives.</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-800">{filtered.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">CERFA</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-blue-600 truncate">{formatMontant(total)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-800 truncate">
            {filtered.length > 0 ? formatMontant(total / filtered.length) : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Moyenne</p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 shadow-sm border border-slate-100">
          Aucun CERFA pour l&apos;année {annee}
        </div>
      ) : (
        <>
          {/* Cartes mobile */}
          <div className="sm:hidden bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{c.numeroCerfa}</p>
                  <p className="text-xs text-slate-500 truncate">{getNom(c.donateur)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(c.dateDon)} · {modeLabel[c.modePaiement] || c.modePaiement}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <p className="text-sm font-bold text-slate-800">{formatMontant(c.montant)}</p>
                  {c.pdfPath && (
                    <a href={c.pdfPath} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between px-3 py-3 bg-slate-50 rounded-b-2xl">
              <p className="text-sm font-bold text-slate-700">Total ({filtered.length})</p>
              <p className="text-sm font-bold text-blue-600">{formatMontant(total)}</p>
            </div>
          </div>

          {/* Tableau desktop */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N° CERFA</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Donateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Montant</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{c.numeroCerfa}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getNom(c.donateur)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.dateDon)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {modeLabel[c.modePaiement] || c.modePaiement}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">{formatMontant(c.montant)}</td>
                      <td className="px-4 py-3">
                        {c.pdfPath && (
                          <a href={c.pdfPath} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors inline-flex">
                            <Download size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">Total ({filtered.length} CERFA)</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">{formatMontant(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
