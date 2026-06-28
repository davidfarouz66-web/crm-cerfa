"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Monitor, Smartphone, Tv, CalendarDays, QrCode, Link2, Users } from "lucide-react";

interface Gala {
  id: string; titre: string; objectif: number; totalCollecte: number;
  dateEvenement: string; lieu: string | null; actif: boolean;
  promesseEnabled: boolean; _count: { dons: number };
}

export default function GalaPage() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [promesseEnabled, setPromesseEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gala").then(r => r.json()).then(d => { setGalas(d); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/gala", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre, objectif, dateEvenement: date, lieu, promesseEnabled }),
    });
    const gala = await res.json();
    setGalas(prev => [{ ...gala, _count: { dons: 0 } }, ...prev]);
    setSaving(false); setShowForm(false);
    setTitre(""); setObjectif(""); setDate(""); setLieu(""); setPromesseEnabled(false);
  }

  function copyLink(galaId: string) {
    const url = `${window.location.origin}/gala/${galaId}/don`;
    navigator.clipboard.writeText(url);
    setCopiedId(galaId);
    setTimeout(() => setCopiedId(null), 2000);
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

          <div className="border border-slate-100 rounded-xl p-4 space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={promesseEnabled} onChange={e => setPromesseEnabled(e.target.checked)} className="w-4 h-4" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Activer les promesses de don</p>
                <p className="text-xs text-slate-400 mt-0.5">Permet aux donateurs de s'engager à faire un don sans payer immédiatement. L'association les recontacte à la date choisie pour finaliser le paiement.</p>
              </div>
            </label>
          </div>

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
            const donUrl = `${origin}/gala/${g.id}/don`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(donUrl)}`;
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-slate-800">{g.titre}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(g.dateEvenement).toLocaleDateString("fr-FR")}</span>
                      {g.lieu && <span>{g.lieu}</span>}
                      <span className="flex items-center gap-1"><Users size={12} />{g._count.dons} dons</span>
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

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <a href={`/gala/${g.id}/ecran`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors">
                    <Monitor size={13} /> Projecteur
                  </a>
                  <a href={`/gala/${g.id}/saisie`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-purple-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors">
                    <Smartphone size={13} /> Saisie staff
                  </a>
                  <a href={`/gala/${g.id}`}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
                    Paramètres
                  </a>
                </div>

                {/* Lien donateur + QR code */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <img src={qrUrl} alt="QR code don" className="w-20 h-20 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <QrCode size={12} /> Lien donateurs
                    </p>
                    <p className="text-xs font-mono text-slate-500 truncate">{donUrl}</p>
                    <button onClick={() => copyLink(g.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      <Link2 size={12} />
                      {copiedId === g.id ? "Copié !" : "Copier le lien"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
