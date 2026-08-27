"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Building2, Upload, ImageIcon, Hash, ShieldCheck, AlertTriangle, Lock, UserCog, CreditCard, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Association {
  nom?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
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
  organismeEligibleMecenat?: boolean;
  articlesFiscauxAutorises?: string;
  typeOrganisme?: string;
  dateVerificationEligibilite?: string;
  commentaireEligibilite?: string;
  responsableLegalNom?: string;
  responsableLegalFonction?: string;
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-200"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const TABS = [
  { id: "association", label: "Association", icon: Building2 },
  { id: "compte", label: "Compte", icon: UserCog },
  { id: "paiements", label: "Paiements", icon: CreditCard },
] as const;
type Tab = typeof TABS[number]["id"];

interface GoCardlessStatus {
  configured: boolean;
  connected: boolean;
  environment: string;
  organisationId?: string | null;
  connectedAt?: string | null;
  migrationRequired?: boolean;
}

export default function ParametresPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "association";
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return requestedTab && TABS.some(t => t.id === requestedTab) ? requestedTab as Tab : "association";
  });

  // Association
  const [assoc, setAssoc] = useState<Association>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [eligible, setEligible] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  // Compte
  const [nom, setNom] = useState("");
  const [emailCompte, setEmailCompte] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingCompte, setSavingCompte] = useState(false);
  const [savedCompte, setSavedCompte] = useState("");
  const [errorCompte, setErrorCompte] = useState("");

  // Paiements
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [gcEnabled, setGcEnabled] = useState(false);
  const [gcStatus, setGcStatus] = useState<GoCardlessStatus | null>(null);
  const [savingPaiements, setSavingPaiements] = useState(false);
  const [savedPaiements, setSavedPaiements] = useState("");

  useEffect(() => {
    fetch("/api/association").then(r => r.json()).then(d => {
      setAssoc(d);
      setEligible(!!d.organismeEligibleMecenat);
      setLoading(false);
    });
    fetch("/api/reglages/paiements").then(r => r.json()).then(d => {
      setStripeEnabled(d.stripe_enabled === "true");
      setStripePublicKey(d.stripe_public_key || "");
      setStripeSecretKey(d.stripe_secret_key || "");
      setGcEnabled(d.gocardless_enabled === "true");
    });
    fetch("/api/gocardless/status").then(r => r.json()).then(setGcStatus);
  }, []);

  useEffect(() => {
    if (session?.user) {
      setNom((session.user as { name?: string }).name || "");
      setEmailCompte(session.user.email || "");
    }
  }, [session]);

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
      setAssoc(prev => ({ ...prev, [type === "logo" ? "logoUrl" : "signatureUrl"]: data.url + "?t=" + Date.now() }));
      const current = await fetch("/api/association").then(r => r.json());
      await fetch("/api/association", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, [type === "logo" ? "logoUrl" : "signatureUrl"]: data.url }),
      });
    }
  }

  async function handleSubmitAssoc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setSaveError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/association", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, logoUrl: assoc.logoUrl, signatureUrl: assoc.signatureUrl, organismeEligibleMecenat: eligible }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error || `Erreur ${res.status}`); }
      else { setAssoc(prev => ({ ...prev, ...json })); setEligible(!!json.organismeEligibleMecenat); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (err) { setSaveError(String(err)); }
    finally { setSaving(false); }
  }

  async function handleSubmitCompte(e: React.FormEvent) {
    e.preventDefault();
    setErrorCompte(""); setSavedCompte("");
    if (newPassword && newPassword !== confirmPassword) { setErrorCompte("Les mots de passe ne correspondent pas."); return; }
    if (newPassword && newPassword.length < 8) { setErrorCompte("Minimum 8 caractères."); return; }
    setSavingCompte(true);
    const res = await fetch("/api/reglages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email: emailCompte, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    setSavingCompte(false);
    const json = await res.json();
    if (!res.ok) { setErrorCompte(json.error || "Erreur."); }
    else { setSavedCompte("Compte mis à jour."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setTimeout(() => setSavedCompte(""), 3000); }
  }

  async function handleSubmitPaiements(e: React.FormEvent) {
    e.preventDefault();
    setSavingPaiements(true);
    await fetch("/api/reglages/paiements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripe_enabled: String(stripeEnabled), stripe_public_key: stripePublicKey, stripe_secret_key: stripeSecretKey, gocardless_enabled: String(gcEnabled) }),
    });
    setSavingPaiements(false);
    setSavedPaiements("Paiements enregistrés."); setTimeout(() => setSavedPaiements(""), 3000);
  }

  async function handleDisconnectGoCardless() {
    setSavingPaiements(true);
    await fetch("/api/gocardless/disconnect", { method: "POST" });
    const status = await fetch("/api/gocardless/status").then(r => r.json());
    setGcStatus(status);
    setSavingPaiements(false);
    setSavedPaiements("GoCardless déconnecté."); setTimeout(() => setSavedPaiements(""), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Paramètres</h1>

      {/* Onglets */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Onglet Association ── */}
      {tab === "association" && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Le logiciel ne valide pas l&apos;éligibilité fiscale. L&apos;association reste seule responsable de vérifier son droit à délivrer des reçus fiscaux.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><ImageIcon size={15} /> Logo</p>
              <p className="text-xs text-slate-400 mb-3">Optionnel</p>
              <div onClick={() => logoRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden">
                {uploadingLogo ? <Loader2 size={24} className="animate-spin text-blue-500" /> :
                  assoc.logoUrl ? <Image src={assoc.logoUrl.split("?")[0]} alt="Logo" width={100} height={80} className="object-contain max-h-24" unoptimized /> :
                  <div className="text-center"><Upload size={20} className="text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-400">Importer</p></div>}
              </div>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} />
              {assoc.logoUrl && <button onClick={() => setAssoc(p => ({ ...p, logoUrl: undefined }))} className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center">Supprimer</button>}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><ImageIcon size={15} /> Signature</p>
              <p className="text-xs text-red-500 mb-3 font-medium">Obligatoire</p>
              <div onClick={() => sigRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden">
                {uploadingSig ? <Loader2 size={24} className="animate-spin text-blue-500" /> :
                  assoc.signatureUrl ? <Image src={assoc.signatureUrl.split("?")[0]} alt="Signature" width={100} height={80} className="object-contain max-h-24" unoptimized /> :
                  <div className="text-center"><Upload size={20} className="text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-400">Importer</p></div>}
              </div>
              <input ref={sigRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "signature")} />
              {assoc.signatureUrl && <button onClick={() => setAssoc(p => ({ ...p, signatureUrl: undefined }))} className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center">Supprimer</button>}
            </div>
          </div>

          <form onSubmit={handleSubmitAssoc} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Building2 size={15} className="text-slate-400" /> Informations générales</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l&apos;association *</label>
                <input name="nom" defaultValue={assoc.nom || ""} placeholder="Nom de l'association"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">N° RNA</label>
                  <input name="rna" defaultValue={assoc.rna || ""}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SIRET</label>
                  <input name="siret" defaultValue={assoc.siret || ""} placeholder="000 000 000 00000" inputMode="numeric"
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
                  <input name="codePostal" defaultValue={assoc.codePostal || ""} placeholder="92200" inputMode="numeric"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
                  <input name="ville" defaultValue={assoc.ville || ""} placeholder="Paris"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
                <input name="pays" defaultValue={assoc.pays ?? "France"} placeholder="France"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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
                  {QUALITES.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                  <input name="telephone" defaultValue={assoc.telephone || ""} placeholder="01 00 00 00 00" type="tel" inputMode="tel"
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><ShieldCheck size={15} className="text-slate-400" /> Éligibilité fiscale</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={eligible} onChange={e => setEligible(e.target.checked)}
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
                    {TYPES_ORGANISME.map(t => <option key={t} value={t}>{t}</option>)}
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lock size={15} className="text-slate-400" /> RGPD</p>
              <p className="text-xs text-slate-500">Finalité : gestion des dons et émission de reçus fiscaux. Base légale : obligation légale (art. 200 CGI).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée de conservation (années)</label>
                  <input type="number" name="dureConservationAnnees" min="1" max="30" defaultValue={assoc.dureConservationAnnees ?? 10} inputMode="numeric"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact responsable traitement</label>
                  <input name="contactRgpd" defaultValue={assoc.contactRgpd || ""} placeholder="rgpd@association.fr"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Hash size={15} className="text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Numérotation des CERFA</p>
              </div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de départ</label>
              <p className="text-xs text-slate-400 mb-2">Laissez à 0 pour numérotation automatique.</p>
              <div className="flex flex-wrap items-center gap-3">
                <input type="number" name="cerfaSequence" min="0" step="1" defaultValue={assoc.cerfaSequence ?? 0} inputMode="numeric"
                  className="w-40 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <span className="text-sm text-slate-400">
                  → prochain : <strong className="text-slate-700">A{new Date().getFullYear()}/{String((assoc.cerfaSequence || 1)).padStart(5, "0")}</strong>
                </span>
              </div>
            </div>

            {saveError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">Erreur : {saveError}</div>}
            {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">✓ Paramètres enregistrés</div>}

            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm mb-4">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </>
      )}

      {/* ── Onglet Compte ── */}
      {tab === "compte" && (
        <form onSubmit={handleSubmitCompte} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Profil</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
              <input type="email" value={emailCompte} onChange={e => setEmailCompte(e.target.value)} placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Changer le mot de passe</p>
            <p className="text-xs text-slate-400 -mt-2">Laissez vide pour ne pas modifier.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          {errorCompte && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertTriangle size={15} className="shrink-0" />{errorCompte}</div>}
          {savedCompte && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">✓ {savedCompte}</div>}

          <button type="submit" disabled={savingCompte}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm mb-4">
            {savingCompte ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingCompte ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {/* ── Onglet Paiements ── */}
      {tab === "paiements" && (
        <form onSubmit={handleSubmitPaiements} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Stripe</p>
                <p className="text-xs text-slate-400">Paiement par carte · ~1.5% de frais</p>
              </div>
              <Toggle checked={stripeEnabled} onChange={setStripeEnabled} />
            </div>
            {stripeEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clé publique</label>
                  <input type="text" value={stripePublicKey} onChange={e => setStripePublicKey(e.target.value)} placeholder="pk_live_..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clé secrète</label>
                  <SecretInput value={stripeSecretKey} onChange={setStripeSecretKey} placeholder="sk_live_..." />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                  Nécessite un compte Stripe avec SIRET et RIB professionnel.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">GoCardless</p>
                <p className="text-xs text-slate-400">Paiement bancaire · compte de l&apos;association</p>
              </div>
              <Toggle checked={gcEnabled} onChange={setGcEnabled} />
            </div>
            {gcEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className={`rounded-xl px-3 py-2 text-xs border ${
                  gcStatus?.connected
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  {gcStatus?.connected ? (
                    <>
                      Compte GoCardless connecté
                      {gcStatus.organisationId ? ` · Organisation ${gcStatus.organisationId}` : ""}
                      {gcStatus.environment ? ` · ${gcStatus.environment}` : ""}
                    </>
                  ) : gcStatus?.migrationRequired ? (
                    "Migration base de données GoCardless à appliquer avant connexion."
                  ) : gcStatus?.configured ? (
                    "Aucun compte GoCardless connecté pour cette association."
                  ) : (
                    "L'app GoCardless n'est pas encore configurée dans Vercel."
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <a href="/api/gocardless/connect"
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-colors ${
                      gcStatus?.configured && !gcStatus?.migrationRequired ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 pointer-events-none"
                    }`}>
                    <CreditCard size={16} />
                    {gcStatus?.connected ? "Reconnecter GoCardless" : "Connecter GoCardless"}
                  </a>
                  {gcStatus?.connected && (
                    <button type="button" onClick={handleDisconnectGoCardless}
                      className="px-4 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
                      Déconnecter
                    </button>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                  Chaque association connecte son propre compte GoCardless. Les paiements créés depuis sa page de don sont encaissés par ce compte.
                </div>
              </div>
            )}
          </div>

          {savedPaiements && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">✓ {savedPaiements}</div>}

          <button type="submit" disabled={savingPaiements}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm mb-4">
            {savingPaiements ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingPaiements ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );
}
