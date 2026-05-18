"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

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
  const [confirmed, setConfirmed] = useState(false);
  const [eligibiliteOk, setEligibiliteOk] = useState<boolean | null>(null);
  const [chronoWarning, setChronoWarning] = useState<{ dernierNumero: string; dernierDate: string } | null>(null);
  const [derogationConfirmed, setDerogationConfirmed] = useState(false);
  const [derogationMotif, setDerogationMotif] = useState("");

  useEffect(() => {
    fetch("/api/donateurs").then((r) => r.json()).then(setDonateurs);
    fetch("/api/association").then((r) => r.json()).then((d) => {
      setEligibiliteOk(!!d.organismeEligibleMecenat);
    });
  }, []);

  const getNom = (d: Donateur) =>
    d.type === "entreprise" ? d.raisonSociale || d.nom : `${d.prenom || ""} ${d.nom}`.trim();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmed) {
      setError("Vous devez certifier que l'organisme est habilité avant de générer le reçu.");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/cerfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        derogationMotif: derogationConfirmed ? derogationMotif : undefined,
      }),
    });

    setLoading(false);
    if (res.ok) {
      const cerfa = await res.json();
      setSuccess({ numeroCerfa: cerfa.numeroCerfa, pdfPath: cerfa.pdfPath });
    } else {
      const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
      if (err.code === "NOT_ELIGIBLE") {
        setError("L'association n'est pas marquée comme éligible au mécénat. Allez dans Paramètres → Éligibilité fiscale pour activer.");
      } else if (err.code === "NOT_CHRONOLOGICAL") {
        setChronoWarning({ dernierNumero: err.dernierNumero, dernierDate: err.dernierDate });
        setError("");
      } else {
        setError(err.error || "Une erreur est survenue");
      }
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">CERFA généré !</h2>
        <p className="text-slate-500 mb-2">N° {success.numeroCerfa}</p>
        <p className="text-xs text-slate-400 mb-6">Ce reçu fiscal est établi sous la responsabilité de l&apos;organisme émetteur.</p>
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
          <button onClick={() => { setSuccess(null); setConfirmed(false); }}
            className="border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            Nouveau CERFA
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">

      {/* Alerte si non éligible */}
      {eligibiliteOk === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">
            L&apos;association n&apos;est pas marquée comme éligible au mécénat.{" "}
            <Link href="/parametres" className="underline">Paramètres → Éligibilité</Link>
          </p>
        </div>
      )}

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

      {/* Dates et montant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date du don *</label>
          <input type="date" name="dateDon" required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <p className="text-xs text-slate-400 mt-1">Peut être antérieure à aujourd&apos;hui</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date d&apos;émission du reçu *</label>
          <input type="date" name="dateEmission" required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <p className="text-xs text-slate-400 mt-1">Doit rester chronologique</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Montant (€) *</label>
        <input type="number" name="montant" required min="0.01" step="0.01" placeholder="100.00"
          inputMode="decimal"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>

      {/* Nature et forme du don */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nature du don *</label>
          <select name="natureDon" required defaultValue="numeraire"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
            <option value="numeraire">Numéraire</option>
            <option value="nature">En nature</option>
            <option value="abandon_frais">Abandon de frais</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Forme du versement *</label>
          <select name="formeDon" required defaultValue="declaration_manuel"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
            <option value="declaration_manuel">Déclaration de don manuel</option>
            <option value="acte_authentique">Acte authentique</option>
            <option value="ssp">Acte sous seing privé</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Article fiscal */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Article fiscal applicable *</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "200", label: "Art. 200", sub: "Particuliers" },
            { value: "238bis", label: "Art. 238 bis", sub: "Entreprises" },
            { value: "978", label: "Art. 978", sub: "IFI" },
          ].map((a) => (
            <label key={a.value} className="relative">
              <input type="radio" name="articleFiscal" value={a.value} required className="peer sr-only" defaultChecked={a.value === "200"} />
              <span className="flex flex-col items-center justify-center p-3 border-2 border-slate-200 rounded-xl cursor-pointer text-sm peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-slate-300 transition-all">
                <span className="font-medium">{a.label}</span>
                <span className="text-xs opacity-70">{a.sub}</span>
              </span>
            </label>
          ))}
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

      {/* Alerte dérogation chronologique */}
      {chronoWarning && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Rupture de chronologie détectée</p>
              <p className="text-xs text-red-600 mt-1">
                Dernier reçu : <strong>{chronoWarning.dernierNumero}</strong> émis le <strong>{chronoWarning.dernierDate}</strong>.
                La date d&apos;émission saisie lui est antérieure.
              </p>
            </div>
          </div>
          <p className="text-xs text-red-700 font-medium">Pour émettre quand même, renseignez un motif et confirmez la dérogation :</p>
          <textarea value={derogationMotif} onChange={(e) => setDerogationMotif(e.target.value)}
            placeholder="Motif obligatoire (ex. : régularisation don 2023 sur demande du donateur...)"
            rows={2}
            className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white" />
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={derogationConfirmed} onChange={(e) => setDerogationConfirmed(e.target.checked)}
              disabled={!derogationMotif.trim()}
              className="w-4 h-4 rounded text-red-600 mt-0.5 shrink-0" />
            <span className="text-xs text-red-700 font-medium">Je confirme la dérogation chronologique — cette exception sera journalisée.</span>
          </label>
        </div>
      )}

      {/* Certification */}
      <div className={`rounded-xl border-2 px-4 py-3 transition-colors ${confirmed ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0" />
          <span className="text-sm text-slate-700 font-medium">
            Je certifie que l&apos;organisme est habilité à délivrer un reçu fiscal pour ce don, conformément aux articles 200, 238 bis ou 978 du CGI.
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex gap-3 pt-2 pb-6">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">
          Annuler
        </button>
        <button type="submit" disabled={loading || !confirmed || eligibiliteOk === false || (!!chronoWarning && !derogationConfirmed)}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Génération..." : "Générer le CERFA"}
        </button>
      </div>
    </form>
  );
}

export default function NouveauCerfaPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cerfa" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Nouveau CERFA</h1>
          <p className="text-slate-500 text-sm mt-0.5">Générez un reçu fiscal en PDF</p>
        </div>
      </div>
      <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <NouveauCerfaForm />
      </Suspense>
    </div>
  );
}
