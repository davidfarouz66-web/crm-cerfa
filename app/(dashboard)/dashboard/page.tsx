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

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Total CERFA émis", value: data.totalCerfa, icon: FileText, color: "bg-blue-500", sub: "Tous temps" },
    { label: `CERFA ${data.annee}`, value: data.cerfasAnnee, icon: TrendingUp, color: "bg-emerald-500", sub: "Cette année" },
    { label: `Dons ${data.annee}`, value: formatMontant(data.totalDonsAnnee), icon: Euro, color: "bg-violet-500", sub: "Cette année" },
    { label: "Donateurs", value: "—", icon: Users, color: "bg-orange-500", sub: "Actifs" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d&apos;ensemble de vos dons — {data.annee}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Graphique mensuel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4">Dons par mois ({data.annee})</h2>
          <ResponsiveContainer width="100%" height={220}>
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4">Par mode de paiement</h2>
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
