"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const MODES = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque",   label: "Chèque" },
  { value: "especes",  label: "Espèces" },
  { value: "cb",       label: "Paiement en ligne" },
];

export default function EditCerfaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    dateDon:      "",
    montant:      "",
    modePaiement: "virement",
    objetDon:     "",
  });

  useEffect(() => {
    fetch(`/api/cerfa/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          dateDon:      d.dateDon?.slice(0, 10) ?? "",
          montant:      String(d.montant ?? ""),
          modePaiement: d.modePaiement ?? "virement",
          objetDon:     d.objetDon ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/cerfa/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push(`/cerfa/${id}`);
    } else {
      const d = await res.json();
      setError(d.error || "Erreur lors de la sauvegarde");
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cerfa/${id}`} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Modifier le CERFA</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date du don</label>
          <input type="date" required value={form.dateDon}
            onChange={(e) => setForm({ ...form, dateDon: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Montant (€)</label>
          <input type="number" required min="0.01" step="0.01" value={form.montant}
            onChange={(e) => setForm({ ...form, montant: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mode de paiement</label>
          <select value={form.modePaiement}
            onChange={(e) => setForm({ ...form, modePaiement: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet du don <span className="text-slate-400 font-normal">(optionnel)</span></label>
          <input type="text" value={form.objetDon}
            onChange={(e) => setForm({ ...form, objetDon: e.target.value })}
            placeholder="Ex : achat de matériel scolaire"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Link href={`/cerfa/${id}`}
            className="flex-1 text-center px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Annuler
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
