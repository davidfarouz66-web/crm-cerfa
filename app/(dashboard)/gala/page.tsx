"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Monitor, Smartphone, Tv, CalendarDays } from "lucide-react";

interface Gala {
  id: string;
  titre: string;
  objectif: number;
  totalCollecte: number;
  dateEvenement: string;
  lieu: string | null;
  actif: boolean;
  _count: { dons: number };
}

export default function GalaPage() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/gala").then(r => r.json()).then(d => { setGalas(d); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/gala", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre, objectif, dateEvenement: date, lieu }),
    });
    const gala = await res.json();
    setGalas(prev => [{ ...gala, _count: { dons: 0 } }, ...prev]);
    setSaving(false);
    setShowForm(false);
    setTitre(""); setObjectif(""); setDate(""); setLieu("");
  }

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Tv size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Galas</h1>
            <p className="text-slate-500 text-sm">Gérer vos événements en direct</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
          <Plus size={16} /> Nouveau gala
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-700">Nouveau gala</h2>
          <input required value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de l'événement *"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" value={objectif} onChange={e => setObjectif(e.target.value)} placeholder="Objectif (€) *" min="1"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          </div>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Lieu (optionnel)"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Créer
            </button>
          </div>
        </form>
      )}

      {galas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Tv size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun gala pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {galas.map(g => {
            const pct = Math.min(100, Math.round((g.totalCollecte / g.objectif) * 100));
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-slate-800">{g.titre}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(g.dateEvenement).toLocaleDateString("fr-FR")}</span>
                      {g.lieu && <span>{g.lieu}</span>}
                      <span>{g._count.dons} dons</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${g.actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {g.actif ? "En cours" : "Inactif"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{fmt(g.totalCollecte)}</span>
                    <span className="text-slate-400">{pct}% de {fmt(g.objectif)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a href={`/gala/${g.id}/ecran`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                    <Monitor size={15} /> Écran projecteur
                  </a>
                  <a href={`/gala/${g.id}/saisie`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
                    <Smartphone size={15} /> Saisie dons
                  </a>
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Lien saisie pour le staff :</p>
                  <p className="text-xs font-mono text-slate-700 break-all">{origin}/gala/{g.id}/saisie</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
