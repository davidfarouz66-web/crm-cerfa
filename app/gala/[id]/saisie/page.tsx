"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Gala { id: string; titre: string; objectif: number; totalCollecte: number; couleurPrimaire: string; }

export default function SaisieDon() {
  const { id } = useParams<{ id: string }>();
  const [gala, setGala] = useState<Gala | null>(null);
  const [montant, setMontant] = useState("");
  const [nom, setNom] = useState("");
  const [anonyme, setAnonyme] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/gala/${id}`).then(r => r.json()).then(setGala);
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || parseFloat(montant) <= 0) return;
    setLoading(true);
    await fetch(`/api/gala/${id}/dons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant, nomAffiche: nom, anonyme, message }),
    });
    setLoading(false);
    setSuccess(true);
    setMontant(""); setNom(""); setMessage(""); setAnonyme(false);
    setTimeout(() => setSuccess(false), 2000);
  }

  const MONTANTS = [50, 100, 200, 500, 1000, 5000];

  if (!gala) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <h1 className="text-lg font-bold text-slate-800">{gala.titre}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(gala.totalCollecte)}
          {" "}/ {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(gala.objectif)}
        </p>
        <div className="w-full h-3 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(100, (gala.totalCollecte / gala.objectif) * 100)}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Montant du don</p>
          <div className="grid grid-cols-3 gap-2">
            {MONTANTS.map(m => (
              <button key={m} type="button" onClick={() => setMontant(String(m))}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${montant === String(m) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {m}€
              </button>
            ))}
          </div>
          <input type="number" value={montant} onChange={e => setMontant(e.target.value)}
            placeholder="Autre montant (€)" min="1"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Donateur</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600" />
            <span className="text-sm text-slate-700">Don anonyme</span>
          </label>
          {!anonyme && (
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Nom à afficher sur l'écran"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          )}
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Message (optionnel)"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} /> Don enregistré !
          </div>
        )}

        <button type="submit" disabled={loading || !montant}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Valider le don
        </button>
      </form>
    </div>
  );
}
