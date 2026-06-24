"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Users, FileText, Euro, AlertTriangle, CheckCircle, Clock, Search, UserCheck, UserX, Hourglass, Eye } from "lucide-react";

interface Tenant {
  id: string;
  tenantId: string;
  nom: string;
  ville: string | null;
  email: string | null;
  userStatus: string;
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

function StatusBadge({ status }: { status: string }) {
  if (status === "active")    return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle size={11} /> Actif</span>;
  if (status === "pending")   return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Hourglass size={11} /> En attente</span>;
  if (status === "suspended") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><UserX size={11} /> Suspendu</span>;
  return <span className="text-xs text-slate-400">{status}</span>;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [consulting, setConsulting] = useState<string | null>(null);

  const role = (session?.user as { role?: string })?.role;

  function loadTenants() {
    fetch("/api/admin/tenants")
      .then(r => r.json())
      .then(d => { setTenants(d); setLoading(false); });
  }

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && role !== "superadmin") { router.push("/dashboard"); return; }
    if (status === "authenticated" && role === "superadmin") loadTenants();
  }, [status, role, router]);

  async function consulter(tenantId: string, nom: string) {
    setConsulting(tenantId);
    await fetch("/api/admin/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, nom }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  async function setStatus(tenantId: string, newStatus: string) {
    setUpdating(tenantId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, status: newStatus }),
    });
    setTenants(prev => prev.map(t => t.tenantId === tenantId ? { ...t, userStatus: newStatus } : t));
    setUpdating(null);
  }

  const filtered = tenants.filter(t =>
    t.nom.toLowerCase().includes(q.toLowerCase()) ||
    (t.email || "").toLowerCase().includes(q.toLowerCase()) ||
    (t.ville || "").toLowerCase().includes(q.toLowerCase())
  );

  const totalActifs  = tenants.filter(t => t.userStatus === "active").length;
  const totalPending = tenants.filter(t => t.userStatus === "pending").length;
  const totalCerfas  = tenants.reduce((s, t) => s + t.nbCerfas, 0);
  const totalDons    = tenants.reduce((s, t) => s + t.totalDons, 0);
  const totalClients = tenants.length;

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
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800">Super-Admin</h1>
            <p className="text-sm text-slate-500">Vue globale de tous les comptes</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            {totalClients} asso{totalClients > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Actifs",        value: totalActifs,              icon: UserCheck, color: "emerald" },
            { label: "En attente",    value: totalPending,             icon: Hourglass, color: totalPending > 0 ? "amber" : "slate" },
            { label: "CERFA émis",    value: totalCerfas,              icon: FileText,  color: "indigo" },
            { label: "Total dons",    value: formatMontant(totalDons), icon: Euro,      color: "blue" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center mb-2`}>
                <Icon size={16} className={`text-${color}-600`} />
              </div>
              <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Cartes mobile */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Aucun résultat</p>
          )}
          {filtered.map(t => {
            const jours = daysSince(t.dernierCerfa);
            const inactif = jours !== null && jours > 60;
            const busy = updating === t.tenantId;
            return (
              <div key={t.id} className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${
                t.userStatus === "suspended" ? "border-red-200" :
                t.userStatus === "pending"   ? "border-amber-200" :
                inactif                      ? "border-amber-100" : "border-slate-100"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{t.nom}</p>
                    {t.ville && <p className="text-xs text-slate-400">{t.ville}</p>}
                    {t.email && <p className="text-xs text-slate-400 truncate">{t.email}</p>}
                  </div>
                  <StatusBadge status={t.userStatus} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-slate-800">{t.nbDonateurs}</p>
                    <p className="text-xs text-slate-500">Donateurs</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-slate-800">{t.nbCerfas}</p>
                    <p className="text-xs text-slate-500">CERFA</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-blue-700 truncate">{formatMontant(t.totalDons)}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>

                {t.dernierNumero && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Dernier : <strong>{t.dernierNumero}</strong></span>
                    <span className={inactif ? "text-amber-600 font-medium" : ""}>
                      {inactif && <Clock size={10} className="inline mr-1" />}
                      {formatDate(t.dernierCerfa)}
                      {inactif && ` (${jours}j)`}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => consulter(t.tenantId, t.nom)}
                    disabled={consulting === t.tenantId}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    <Eye size={12} /> Consulter
                  </button>
                  {t.userStatus !== "active" && (
                    <button
                      onClick={() => setStatus(t.tenantId, "active")}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      <UserCheck size={12} /> Activer
                    </button>
                  )}
                  {t.userStatus !== "suspended" && (
                    <button
                      onClick={() => setStatus(t.tenantId, "suspended")}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <UserX size={12} /> Suspendre
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tableau desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Association</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-center px-4 py-3 font-medium">Statut</th>
                <th className="text-center px-4 py-3 font-medium">Éligible</th>
                <th className="text-right px-4 py-3 font-medium">Donateurs</th>
                <th className="text-right px-4 py-3 font-medium">CERFA</th>
                <th className="text-right px-4 py-3 font-medium">Total dons</th>
                <th className="text-left px-4 py-3 font-medium">Dernier CERFA</th>
                <th className="text-left px-4 py-3 font-medium">Créé le</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => {
                const jours = daysSince(t.dernierCerfa);
                const inactif = jours !== null && jours > 60;
                const busy = updating === t.tenantId;
                return (
                  <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${
                    t.userStatus === "suspended" ? "bg-red-50/30" :
                    t.userStatus === "pending"   ? "bg-amber-50/30" :
                    inactif                      ? "bg-amber-50/20" : ""
                  }`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{t.nom}</p>
                      {t.ville && <p className="text-xs text-slate-400">{t.ville}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{t.email || "—"}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={t.userStatus} /></td>
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
                              {formatDate(t.dernierCerfa)}{inactif && ` (${jours}j)`}
                            </p>
                          </div>
                        : <span className="text-xs text-slate-400">Aucun</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => consulter(t.tenantId, t.nom)} disabled={consulting === t.tenantId}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50">
                          <Eye size={12} /> Consulter
                        </button>
                        {t.userStatus !== "active" && (
                          <button onClick={() => setStatus(t.tenantId, "active")} disabled={busy}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                            <UserCheck size={12} /> Activer
                          </button>
                        )}
                        {t.userStatus !== "suspended" && (
                          <button onClick={() => setStatus(t.tenantId, "suspended")} disabled={busy}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50">
                            <UserX size={12} /> Suspendre
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">Aucun résultat</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Les éléments en jaune indiquent des comptes inactifs depuis plus de 60 jours.
        </p>
      </div>
    </div>
  );
}
