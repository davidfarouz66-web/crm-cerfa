"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DonateurFormProps {
  initial?: {
    id?: string;
    type?: string;
    nom?: string;
    prenom?: string;
    raisonSociale?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    email?: string;
    telephone?: string;
    notes?: string;
  };
  mode: "create" | "edit";
}

export default function DonateurForm({ initial = {}, mode }: DonateurFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState(initial.type || "particulier");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const url = mode === "edit" ? `/api/donateurs/${initial.id}` : "/api/donateurs";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      router.push(`/donateurs/${d.id}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Une erreur est survenue");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Type de donateur</label>
        <div className="grid grid-cols-2 gap-3">
          {["particulier", "entreprise"].map((t) => (
            <label key={t} className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
              type === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}>
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              {t === "particulier" ? "👤 Particulier" : "🏢 Entreprise"}
            </label>
          ))}
        </div>
      </div>

      {/* Nom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {type === "particulier" ? (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Civilité</label>
              <div className="flex gap-3">
                {["M", "Mme", "Dr", "Me"].map((c) => (
                  <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="civilite" value={c} defaultChecked={(initial as { civilite?: string }).civilite === c || (!( initial as { civilite?: string }).civilite && c === "M")}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-slate-700">{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
              <input name="prenom" defaultValue={initial.prenom || ""} placeholder="David"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
              <input name="nom" defaultValue={initial.nom || ""} placeholder="Dupont" required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Raison sociale *</label>
              <input name="raisonSociale" defaultValue={initial.raisonSociale || ""} placeholder="SARL Exemple" required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Forme juridique</label>
              <select name="formeJuridique" defaultValue={(initial as { formeJuridique?: string }).formeJuridique || ""}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">Sélectionner...</option>
                {["SARL","SAS","SASU","SA","SCI","EURL","Auto-entrepreneur","Association","Fondation","Autre"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SIREN</label>
              <input name="siretDonateur" defaultValue={(initial as { siretDonateur?: string }).siretDonateur || ""} placeholder="123 456 789"
                inputMode="numeric"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom du contact</label>
              <input name="nom" defaultValue={initial.nom || ""} placeholder="Nom du représentant"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </>
        )}
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
        <input name="adresse" defaultValue={initial.adresse || ""} placeholder="1 rue de la Paix"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
          <input name="codePostal" defaultValue={initial.codePostal || ""} placeholder="75001"
            inputMode="numeric"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
          <input name="ville" defaultValue={initial.ville || ""} placeholder="Paris"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
        <input name="pays" defaultValue={(initial as { pays?: string }).pays || "France"} placeholder="France"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input type="email" name="email" defaultValue={initial.email || ""} placeholder="jean@exemple.fr"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
          <input type="tel" name="telephone" defaultValue={initial.telephone || ""} placeholder="06 00 00 00 00"
            inputMode="tel"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Notes internes</label>
        <textarea name="notes" defaultValue={initial.notes || ""} rows={3}
          placeholder="Informations complémentaires..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex gap-3 pt-2 pb-6">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">
          Annuler
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "Ajouter le donateur" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
