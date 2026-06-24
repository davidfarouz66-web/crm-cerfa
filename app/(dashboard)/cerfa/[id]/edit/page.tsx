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

const NATURES = [
  { value: "numeraire",     label: "Numéraire" },
  { value: "nature",        label: "Titres de sociétés cotées" },
  { value: "abandon_frais", label: "Abandon de frais / Autres" },
];

const FORMES = [
  { value: "declaration_manuel", label: "Déclaration de don manuel" },
  { value: "acte_authentique",   label: "Acte authentique" },
  { value: "ssp",                label: "Acte sous seing privé" },
  { value: "autre",              label: "Autre" },
];

const ARTICLES = [
  { value: "200",    label: "Art. 200 — Particuliers" },
  { value: "238bis", label: "Art. 238 bis — Entreprises" },
  { value: "978",    label: "Art. 978 — IFI" },
];

export default function EditCerfaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    dateDon:      "",
    dateEmission: "",
    montant:      "",
    modePaiement: "virement",
    natureDon:    "numeraire",
    formeDon:     "declaration_manuel",
    articleFiscal: "200",
    objetDon:     "",
  });

  useEffect(() => {
    fetch(`/api/cerfa/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          dateDon:       d.dateDon?.slice(0, 10) ?? "",
          dateEmission:  d.dateEmission?.slice(0, 10) ?? "",
          montant:       String(d.montant ?? ""),
          modePaiement:  d.modePaiement ?? "virement",
          natureDon:     d.natureDon ?? "numeraire",
          formeDon:      d.formeDon ?? "declaration_manuel",
          articleFiscal: d.articleFiscal ?? "200",
          objetDon:      d.objetDon ?? "",
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
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cerfa/${id}`} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Modifier le CERFA</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date du paiement</label>
            <input type="date" required value={form.dateDon}
              onChange={(e) => setForm({ ...form, dateDon: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-slate-400 mt-1">Virement / chèque / espèces</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date d&apos;émission du reçu</label>
            <input type="date" required value={form.dateEmission}
              onChange={(e) => setForm({ ...form, dateEmission: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-slate-400 mt-1">Date de signature</p>
          </div>
        </div>

        {/* Montant */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Montant (€)</label>
          <input type="number" required min="0.01" step="0.01" value={form.montant}
            onChange={(e) => setForm({ ...form, montant: e.target.value })}
            inputMode="decimal"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Mode de paiement */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mode de paiement</label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <label key={m.value} className={`flex items-center justify-center p-2.5 border-2 rounded-xl cursor-pointer text-sm transition-all ${
                form.modePaiement === m.value ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
                <input type="radio" name="modePaiement" value={m.value} checked={form.modePaiement === m.value}
                  onChange={() => setForm({ ...form, modePaiement: m.value })} className="sr-only" />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {/* Article fiscal */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Article fiscal</label>
          <div className="grid grid-cols-3 gap-2">
            {ARTICLES.map((a) => (
              <label key={a.value} className={`flex items-center justify-center p-2.5 border-2 rounded-xl cursor-pointer text-xs text-center transition-all ${
                form.articleFiscal === a.value ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
                <input type="radio" name="articleFiscal" value={a.value} checked={form.articleFiscal === a.value}
                  onChange={() => setForm({ ...form, articleFiscal: a.value })} className="sr-only" />
                {a.label}
              </label>
            ))}
          </div>
        </div>

        {/* Nature du don */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nature du don</label>
          <select value={form.natureDon} onChange={(e) => setForm({ ...form, natureDon: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {NATURES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        {/* Forme du don */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Forme du don</label>
          <select value={form.formeDon} onChange={(e) => setForm({ ...form, formeDon: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {FORMES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Objet du don */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet du don <span className="text-slate-400 font-normal">(optionnel)</span></label>
          <input type="text" value={form.objetDon}
            onChange={(e) => setForm({ ...form, objetDon: e.target.value })}
            placeholder="Ex : achat de matériel scolaire"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1 pb-4">
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
