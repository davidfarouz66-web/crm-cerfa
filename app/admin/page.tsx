"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Users, FileText, Euro, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";

interface Tenant {
  id: string;
  tenantId: string;
  nom: string;
  ville: string | null;
  email: string | null;
  createdAt: string;
  nbDonateurs: number;
  nbCerfas: number;
  totalDons: number;
  dernierCerfa: string | null;
  dernierNumero: string | null;
  eligible: boolean;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMontant(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function daysSince(d: string | null) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const role = (session?.user as { role?: string })?.role;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && role !== "superadmin") { router.push("/dashboard"); return; }
    if (status === "authenticated" && role === "superadmin") {
      fetch("/api/admin/tenants")
        .then(r => r.json())
        .then(d => { setTenants(d); setLoading(false); });
    }
  }, [status, role, router]);

  const filtered = tenants.filter(t =>
    t.nom.toLowerCase().includes(q.toLowerCase()) ||
    (t.email || "").toLowerCase().includes(q.toLowerCase()) ||
    (t.ville || "").toLowerCase().includes(q.toLowerCase())
  );

  const totalCerfas   = tenants.reduce((s, t) => s + t.nbCerfas, 0);
  const totalDons     = tenants.reduce((s, t) => s + t.totalDons, 0);
  const totalClients  = tenants.length;
  const nonEligibles  = tenants.filter(t => !t.eligible).length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">⚙️ Super-Admin</h1>
            <p className="text-sm text-slate-500">Vue globale de tous les comptes clients</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            {totalClients} association{totalClients > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* KPIs globaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Clients actifs",   value: totalClients,          icon: Building2, color: "blue"   },
            { label: "CERFA émis",       value: totalCerfas,           icon: FileText,  color: "indigo" },
            { label: "Dons collectés",   value: formatMontant(totalDons), icon: Euro,   color: "emerald"},
            { label: "Non éligibles",    value: nonEligibles,          icon: AlertTriangle, color: nonEligibles > 0 ? "red" : "slate" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher par nom, email ou ville…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Tableau des clients */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Association</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-center px-4 py-3 font-medium">Éligible</th>
                <th className="text-right px-4 py-3 font-medium">Donateurs</th>
                <th className="text-right px-4 py-3 font-medium">CERFA</th>
                <th className="text-right px-4 py-3 font-medium">Total dons</th>
                <th className="text-left px-4 py-3 font-medium">Dernier CERFA</th>
                <th className="text-left px-4 py-3 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => {
                const jours = daysSince(t.dernierCerfa);
                const inactif = jours !== null && jours > 60;
                return (
                  <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${inactif ? "bg-amber-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{t.nom}</p>
                      {t.ville && <p className="text-xs text-slate-400">{t.ville}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{t.email || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {t.eligible
                        ? <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                        : <AlertTriangle size={16} className="text-amber-500 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{t.nbDonateurs}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{t.nbCerfas}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatMontant(t.totalDons)}</td>
                    <td className="px-4 py-3">
                      {t.dernierNumero
                        ? <div>
                            <p className="text-xs font-medium text-slate-700">{t.dernierNumero}</p>
                            <p className={`text-xs ${inactif ? "text-amber-600 font-medium" : "text-slate-400"}`}>
                              {inactif && <Clock size={10} className="inline mr-1" />}
                              {formatDate(t.dernierCerfa)}
                              {inactif && ` (${jours}j)`}
                            </p>
                          </div>
                        : <span className="text-xs text-slate-400">Aucun</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Les lignes en jaune indiquent des comptes inactifs depuis plus de 60 jours.
        </p>
      </div>
    </div>
  );
}
