"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Donateur {
  id: string;
  type: string;
  nom: string;
  prenom?: string;
  raisonSociale?: string;
}

function NouveauCerfaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("donateurId") || "";

  const [donateurs, setDonateurs] = useState<Donateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ numeroCerfa: string; pdfPath: string } | null>(null);

  useEffect(() => {
    fetch("/api/donateurs").then((r) => r.json()).then(setDonateurs);
  }, []);

  const getNom = (d: Donateur) =>
    d.type === "entreprise" ? d.raisonSociale || d.nom : `${d.prenom || ""} ${d.nom}`.trim();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/cerfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      const cerfa = await res.json();
      setSuccess({ numeroCerfa: cerfa.numeroCerfa, pdfPath: cerfa.pdfPath });
    } else {
      const err = await res.json().catch(() => ({ error: "Erreur serveur — vérifiez que l'association est configurée dans Paramètres" }));
      setError(err.error || "Une erreur est survenue");
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">CERFA généré !</h2>
        <p className="text-slate-500 mb-6">N° {success.numeroCerfa}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {success.pdfPath && (
            <a href={success.pdfPath} target="_blank" rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Télécharger le PDF
            </a>
          )}
          <button onClick={() => router.push("/cerfa")}
            className="border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            Voir tous les CERFA
          </button>
          <button onClick={() => { setSuccess(null); }}
            className="border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            Nouveau CERFA
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
      {/* Donateur */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Donateur *</label>
        <select name="donateurId" required defaultValue={preselectedId}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800">
          <option value="">Sélectionner un donateur...</option>
          {donateurs.map((d) => (
            <option key={d.id} value={d.id}>{getNom(d)}</option>
          ))}
        </select>
        <Link href="/donateurs/nouveau" className="text-xs text-blue-600 mt-1 inline-block hover:underline">
          + Ajouter un nouveau donateur
        </Link>
      </div>

      {/* Date et montant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date du don *</label>
          <input type="date" name="dateDon" required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Montant (€) *</label>
          <input type="number" name="montant" required min="0.01" step="0.01" placeholder="100.00"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>

      {/* Mode de paiement */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Mode de paiement *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "virement", label: "🏦 Virement" },
            { value: "cheque", label: "📄 Chèque" },
            { value: "especes", label: "💶 Espèces" },
            { value: "cb", label: "💳 CB" },
          ].map((m) => (
            <label key={m.value} className="relative">
              <input type="radio" name="modePaiement" value={m.value} required className="peer sr-only" />
              <span className="flex items-center justify-center p-3 border-2 border-slate-200 rounded-xl cursor-pointer text-sm text-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-slate-300 transition-all">
                {m.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Objet du don */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Objet du don</label>
        <input name="objetDon" placeholder="Aide aux familles, formation, équipement..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">
          Annuler
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Génération en cours..." : "Générer le CERFA"}
        </button>
      </div>
    </form>
  );
}

export default function NouveauCerfaPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cerfa" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouveau CERFA</h1>
          <p className="text-slate-500 text-sm mt-0.5">Générez un reçu fiscal en PDF</p>
        </div>
      </div>
      <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <NouveauCerfaForm />
      </Suspense>
    </div>
  );
}
