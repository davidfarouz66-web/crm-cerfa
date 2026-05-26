"use client";

import { useEffect, useState } from "react";
import { FileText, Users, TrendingUp, Euro, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatMontant, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  totalCerfa: number;
  totalDonsAnnee: number;
  cerfasAnnee: number;
  totalDonateurs: number;
  derniersCerfa: {
    id: string;
    numeroCerfa: string;
    montant: number;
    dateDon: string;
    modePaiement: string;
    donateur: { nom: string; prenom?: string; raisonSociale?: string; type: string };
  }[];
  chartMois: { mois: string; total: number; count: number }[];
  parMode: { modePaiement: string; _sum: { montant: number }; _count: number }[];
  annee: number;
}

const modeLabel: Record<string, string> = {
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  cb: "CB",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) { setError(true); return; }
        setData(d);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-slate-500 text-sm">Erreur de chargement</p>
        <button onClick={() => { setError(false); window.location.reload(); }}
          className="text-blue-600 text-sm underline">Réessayer</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8 space-y-4 md:space-y-6 animate-pulse">
        <div className="h-7 bg-slate-100 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-100 rounded-2xl h-28" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-100 rounded-2xl h-72" />
          <div className="bg-slate-100 rounded-2xl h-72" />
        </div>
        <div className="bg-slate-100 rounded-2xl h-48" />
      </div>
    );
  }

  const stats = [
    { label: "Total CERFA émis", value: data.totalCerfa, icon: FileText, color: "bg-blue-500", sub: "Tous temps" },
    { label: `CERFA ${data.annee}`, value: data.cerfasAnnee, icon: TrendingUp, color: "bg-emerald-500", sub: "Cette année" },
    { label: `Dons ${data.annee}`, value: formatMontant(data.totalDonsAnnee), icon: Euro, color: "bg-violet-500", sub: "Cette année" },
    { label: "Donateurs", value: data.totalDonateurs, icon: Users, color: "bg-orange-500", sub: "Enregistrés" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1 text-sm">Vue d&apos;ensemble de vos dons — {data.annee}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Graphique mensuel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm md:text-base">Dons par mois ({data.annee})</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.chartMois}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip formatter={(v) => formatMontant(Number(v))} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Par mode de paiement */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm md:text-base">Par mode de paiement</h2>
          <div className="space-y-3">
            {data.parMode.map((m) => (
              <div key={m.modePaiement} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{modeLabel[m.modePaiement] || m.modePaiement}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatMontant(m._sum.montant || 0)}</p>
                  <p className="text-xs text-slate-400">{m._count} don(s)</p>
                </div>
              </div>
            ))}
            {data.parMode.length === 0 && <p className="text-sm text-slate-400">Aucune donnée</p>}
          </div>
        </div>
      </div>

      {/* Derniers CERFA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Derniers CERFA émis</h2>
          <Link href="/cerfa" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {data.derniersCerfa.map((c) => (
            <Link key={c.id} href={`/cerfa/${c.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800 text-sm">{c.numeroCerfa}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.donateur.type === "entreprise"
                    ? c.donateur.raisonSociale || c.donateur.nom
                    : `${c.donateur.prenom || ""} ${c.donateur.nom}`.trim()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">{formatMontant(c.montant)}</p>
                <p className="text-xs text-slate-400">{formatDate(c.dateDon)}</p>
              </div>
            </Link>
          ))}
          {data.derniersCerfa.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <p>Aucun CERFA généré pour l&apos;instant</p>
              <Link href="/cerfa/nouveau" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                Créer le premier CERFA →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
