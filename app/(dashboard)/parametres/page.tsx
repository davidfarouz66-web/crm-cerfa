"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Building2, Upload, ImageIcon, Hash, ShieldCheck, AlertTriangle, Lock } from "lucide-react";
import Image from "next/image";

interface Association {
  nom?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siret?: string;
  rna?: string;
  objetSocial?: string;
  qualiteOrganisme?: string;
  representant?: string;
  telephone?: string;
  email?: string;
  logoUrl?: string;
  signatureUrl?: string;
  cerfaSequence?: number;
  // Éligibilité
  organismeEligibleMecenat?: boolean;
  articlesFiscauxAutorises?: string;
  typeOrganisme?: string;
  dateVerificationEligibilite?: string;
  commentaireEligibilite?: string;
  responsableLegalNom?: string;
  responsableLegalFonction?: string;
  // RGPD
  dureConservationAnnees?: number;
  contactRgpd?: string;
}

const QUALITES = [
  "Oeuvre ou organisme d'intérêt général",
  "Association reconnue d'utilité publique",
  "Fondation reconnue d'utilité publique",
  "Association cultuelle ou de bienfaisance",
  "Établissement d'enseignement supérieur",
  "Organisme agréé de recherche scientifique",
];

const TYPES_ORGANISME = [
  "Intérêt général",
  "Reconnue d'utilité publique (RUP)",
  "Cultuelle ou de bienfaisance",
  "Aide aux personnes en difficulté",
  "Enseignement ou recherche",
  "Autre",
];

export default function ParametresPage() {
  const [assoc, setAssoc] = useState<Association>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [eligible, setEligible] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/association").then((r) => r.json()).then((d) => {
      setAssoc(d);
      setEligible(!!d.organismeEligibleMecenat);
      setLoading(false);
    });
  }, []);

  async function handleUpload(file: File, type: "logo" | "signature") {
    const setter = type === "logo" ? setUploadingLogo : setUploadingSig;
    setter(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setter(false);
    if (data.url) {
      setAssoc((prev) => ({ ...prev, [type === "logo" ? "logoUrl" : "signatureUrl"]: data.url + "?t=" + Date.now() }));
      const current = await fetch("/api/association").then(r => r.json());
      await fetch("/api/association", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, [type === "logo" ? "logoUrl" : "signatureUrl"]: data.url }),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    await fetch("/api/association", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        logoUrl: assoc.logoUrl,
        signatureUrl: assoc.signatureUrl,
        organismeEligibleMecenat: eligible,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Paramètres association</h1>
          <p className="text-slate-500 text-sm mt-0.5">Informations affichées sur vos CERFA</p>
        </div>
      </div>

      {/* Avertissement général */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex gap-2">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Le logiciel ne valide pas l&apos;éligibilité fiscale de l&apos;association. L&apos;association reste seule responsable de vérifier son droit à délivrer des reçus fiscaux.
        </p>
      </div>

      {/* Images : Logo + Signature */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <ImageIcon size={15} /> Logo
          </p>
          <p className="text-xs text-slate-400 mb-3">Optionnel</p>
          <div onClick={() => logoRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden">
            {uploadingLogo ? <Loader2 size={24} className="animate-spin text-blue-500" /> :
              assoc.logoUrl ? <Image src={assoc.logoUrl.split("?")[0]} alt="Logo" width={100} height={80} className="object-contain max-h-24" unoptimized /> :
              <div className="text-center"><Upload size={20} className="text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-400">Importer</p></div>
            }
          </div>
          <input ref={logoRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} />
          {assoc.logoUrl && <button onClick={() => setAssoc(p => ({ ...p, logoUrl: undefined }))} className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center">Supprimer</button>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ImageIcon size={15} /> Signature
          </p>
          <div onClick={() => sigRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden">
            {uploadingSig ? <Loader2 size={24} className="animate-spin text-blue-500" /> :
              assoc.signatureUrl ? <Image src={assoc.signatureUrl.split("?")[0]} alt="Signature" width={100} height={80} className="object-contain max-h-24" unoptimized /> :
              <div className="text-center"><Upload size={20} className="text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-400">Importer</p></div>
            }
          </div>
          <input ref={sigRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "signature")} />
          {assoc.signatureUrl && <button onClick={() => setAssoc(p => ({ ...p, signatureUrl: undefined }))} className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center">Supprimer</button>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Infos association */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Building2 size={15} className="text-slate-400" /> Informations générales</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l&apos;association *</label>
            <input name="nom" defaultValue={assoc.nom || ""} placeholder="A.C.T."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">N° RNA</label>
              <input name="rna" defaultValue={assoc.rna || ""} placeholder="W922003899"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SIRET</label>
              <input name="siret" defaultValue={assoc.siret || ""} placeholder="000 000 000 00000"
                inputMode="numeric"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
            <input name="adresse" defaultValue={assoc.adresse || ""} placeholder="40, rue Perronet"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
              <input name="codePostal" defaultValue={assoc.codePostal || ""} placeholder="92200"
                inputMode="numeric"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
              <input name="ville" defaultValue={assoc.ville || ""} placeholder="Neuilly-sur-Seine"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Objet social</label>
            <textarea name="objetSocial" defaultValue={assoc.objetSocial || ""} rows={3}
              placeholder="Assurer la pérennité et le fonctionnement du culte..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Qualité de l&apos;organisme</label>
            <select name="qualiteOrganisme" defaultValue={assoc.qualiteOrganisme || QUALITES[0]}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              {QUALITES.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
              <input name="telephone" defaultValue={assoc.telephone || ""} placeholder="01 00 00 00 00"
                type="tel" inputMode="tel"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input name="email" defaultValue={assoc.email || ""} placeholder="contact@association.fr"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Représentant légal</label>
            <input name="representant" defaultValue={assoc.representant || ""} placeholder="Jean Dupont, Président"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>

        {/* Éligibilité fiscale */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><ShieldCheck size={15} className="text-slate-400" /> Éligibilité fiscale</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-700 font-medium">L&apos;organisme est éligible au mécénat (art. 200 / 238 bis / 978 CGI)</span>
          </label>

          {!eligible && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">Tant que cette case n&apos;est pas cochée, la génération de CERFA sera bloquée.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Articles fiscaux autorisés</label>
              <select name="articlesFiscauxAutorises" defaultValue={assoc.articlesFiscauxAutorises || "200"}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="200">Art. 200 — Particuliers</option>
                <option value="238bis">Art. 238 bis — Entreprises</option>
                <option value="978">Art. 978 — IFI</option>
                <option value="200,238bis">Art. 200 + 238 bis</option>
                <option value="200,238bis,978">Art. 200 + 238 bis + 978</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type d&apos;organisme</label>
              <select name="typeOrganisme" defaultValue={assoc.typeOrganisme || ""}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">Sélectionner...</option>
                {TYPES_ORGANISME.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Responsable légal — Nom</label>
              <input name="responsableLegalNom" defaultValue={assoc.responsableLegalNom || ""} placeholder="Jean Dupont"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fonction</label>
              <input name="responsableLegalFonction" defaultValue={assoc.responsableLegalFonction || ""} placeholder="Président"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date de dernière vérification</label>
            <input type="date" name="dateVerificationEligibilite"
              defaultValue={assoc.dateVerificationEligibilite ? assoc.dateVerificationEligibilite.split("T")[0] : ""}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Commentaire éligibilité</label>
            <textarea name="commentaireEligibilite" defaultValue={assoc.commentaireEligibilite || ""} rows={2}
              placeholder="Ex. : rescrit fiscal obtenu le 01/01/2024, valable 3 ans..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
          </div>
        </div>

        {/* RGPD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lock size={15} className="text-slate-400" /> RGPD</p>
          <p className="text-xs text-slate-500">Finalité : gestion des dons et émission de reçus fiscaux. Base légale : obligation légale (art. 200 CGI).</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Durée de conservation (années)</label>
              <input type="number" name="dureConservationAnnees" min="1" max="30"
                defaultValue={assoc.dureConservationAnnees ?? 10}
                inputMode="numeric"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact responsable traitement</label>
              <input name="contactRgpd" defaultValue={assoc.contactRgpd || ""} placeholder="rgpd@association.fr"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
        </div>

        {/* Numérotation CERFA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={15} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Numérotation des CERFA</p>
          </div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de départ</label>
          <p className="text-xs text-slate-400 mb-2">Le prochain CERFA sera au minimum ce numéro. Laissez à 0 pour numérotation automatique.</p>
          <div className="flex items-center gap-3">
            <input type="number" name="cerfaSequence" min="0" step="1"
              defaultValue={assoc.cerfaSequence ?? 0}
              inputMode="numeric"
              className="w-40 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <span className="text-sm text-slate-400">
              → prochain : <strong className="text-slate-700">A{new Date().getFullYear()}/{String((assoc.cerfaSequence || 1)).padStart(5, "0")}</strong>
            </span>
          </div>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            ✓ Paramètres enregistrés
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
