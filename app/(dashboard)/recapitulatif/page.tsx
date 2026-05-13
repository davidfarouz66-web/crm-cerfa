"use client";

import { useEffect, useState } from "react";
import { Download, Filter } from "lucide-react";
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
    fetch(`/api/cerfa?annee=${annee}`)
      .then((r) => r.json())
      .then((d) => { setCerfas(d); setLoading(false); });
  }, [annee]);

  const filtered = filterMode ? cerfas.filter((c) => c.modePaiement === filterMode) : cerfas;
  const total = filtered.reduce((s, c) => s + c.montant, 0);

  const getNom = (d: Cerfa["donateur"]) =>
    d.type === "entreprise" ? d.raisonSociale || d.nom : `${d.prenom || ""} ${d.nom}`.trim();

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Récapitulatif annuel</h1>
          <p className="text-slate-500 mt-1">Vue d&apos;ensemble par année</p>
        </div>
        <a href={`/api/export?annee=${annee}`}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Download size={16} />
          <span className="hidden sm:inline">Export Excel</span>
        </a>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={annee} onChange={(e) => setAnnee(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les modes</option>
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
            <option value="cb">CB</option>
          </select>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
          <p className="text-sm text-slate-500 mt-1">CERFA émis</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{formatMontant(total)}</p>
          <p className="text-sm text-slate-500 mt-1">Total des dons</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-slate-800">
            {filtered.length > 0 ? formatMontant(total / filtered.length) : "—"}
          </p>
          <p className="text-sm text-slate-500 mt-1">Don moyen</p>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N° CERFA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Donateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Mode</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Montant</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{c.numeroCerfa}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{getNom(c.donateur)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">{formatDate(c.dateDon)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
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
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">
                      Total ({filtered.length} CERFA)
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">{formatMontant(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                Aucun CERFA pour l&apos;année {annee}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
