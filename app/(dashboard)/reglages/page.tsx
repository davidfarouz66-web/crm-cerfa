"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, UserCog, CreditCard, Building2, Eye, EyeOff } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
      />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ReglagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;

  // Compte
  const [nom, setNom] = useState((session?.user?.name as string) || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingCompte, setLoadingCompte] = useState(false);
  const [successCompte, setSuccessCompte] = useState("");
  const [errorCompte, setErrorCompte] = useState("");

  // Paiements
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [gcEnabled, setGcEnabled] = useState(false);
  const [gcToken, setGcToken] = useState("");
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [successPaiements, setSuccessPaiements] = useState("");
  const [errorPaiements, setErrorPaiements] = useState("");

  useEffect(() => {
    fetch("/api/reglages/paiements").then(r => r.json()).then(d => {
      setStripeEnabled(d.stripe_enabled === "true");
      setStripePublicKey(d.stripe_public_key || "");
      setStripeSecretKey(d.stripe_secret_key || "");
      setGcEnabled(d.gocardless_enabled === "true");
      setGcToken(d.gocardless_access_token || "");
    });
  }, []);

  if (status === "loading") return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (role !== "admin" && role !== "superadmin") {
    router.replace("/dashboard");
    return null;
  }

  async function handleSubmitCompte(e: React.FormEvent) {
    e.preventDefault();
    setErrorCompte(""); setSuccessCompte("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorCompte("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setErrorCompte("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoadingCompte(true);
    const res = await fetch("/api/reglages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    setLoadingCompte(false);

    const json = await res.json();
    if (!res.ok) {
      setErrorCompte(json.error || "Une erreur est survenue.");
    } else {
      setSuccessCompte("Réglages sauvegardés.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  }

  async function handleSubmitPaiements(e: React.FormEvent) {
    e.preventDefault();
    setErrorPaiements(""); setSuccessPaiements("");
    setLoadingPaiements(true);

    const res = await fetch("/api/reglages/paiements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stripe_enabled: String(stripeEnabled),
        stripe_public_key: stripePublicKey,
        stripe_secret_key: stripeSecretKey,
        gocardless_enabled: String(gcEnabled),
        gocardless_access_token: gcToken,
      }),
    });
    setLoadingPaiements(false);

    if (!res.ok) {
      setErrorPaiements("Une erreur est survenue.");
    } else {
      setSuccessPaiements("Paiements sauvegardés.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <UserCog size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Réglages</h1>
          <p className="text-slate-500 text-sm">Compte et paiements en ligne</p>
        </div>
      </div>

      {/* ── Compte ── */}
      <form onSubmit={handleSubmitCompte} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Profil</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Changer le mot de passe</h2>
          <p className="text-xs text-slate-400">Laissez vide pour ne pas modifier.</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>

        {errorCompte && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="shrink-0" />{errorCompte}
          </div>
        )}
        {successCompte && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} className="shrink-0" />{successCompte}
          </div>
        )}

        <button type="submit" disabled={loadingCompte}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loadingCompte && <Loader2 size={16} className="animate-spin" />}
          {loadingCompte ? "Enregistrement..." : "Enregistrer le profil"}
        </button>
      </form>

      {/* ── Paiements ── */}
      <form onSubmit={handleSubmitPaiements} className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Paiements en ligne</h2>
            <p className="text-slate-500 text-xs">Activez Stripe et/ou GoCardless pour recevoir des dons en ligne</p>
          </div>
        </div>

        {/* Stripe */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Stripe</p>
                <p className="text-xs text-slate-400">Paiement par carte · ~1.5% de frais</p>
              </div>
            </div>
            <Toggle checked={stripeEnabled} onChange={setStripeEnabled} />
          </div>

          {stripeEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clé publique</label>
                <input type="text" value={stripePublicKey} onChange={e => setStripePublicKey(e.target.value)}
                  placeholder="pk_live_..."
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

        {/* GoCardless */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">GoCardless</p>
                <p className="text-xs text-slate-400">Virement SEPA · ~1% plafonné à 2€</p>
              </div>
            </div>
            <Toggle checked={gcEnabled} onChange={setGcEnabled} />
          </div>

          {gcEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Token d'accès</label>
                <SecretInput value={gcToken} onChange={setGcToken} placeholder="live_..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                Nécessite un compte GoCardless avec SIRET et RIB professionnel.
              </div>
            </div>
          )}
        </div>

        {errorPaiements && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="shrink-0" />{errorPaiements}
          </div>
        )}
        {successPaiements && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} className="shrink-0" />{successPaiements}
          </div>
        )}

        <button type="submit" disabled={loadingPaiements}
          className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8">
          {loadingPaiements && <Loader2 size={16} className="animate-spin" />}
          {loadingPaiements ? "Enregistrement..." : "Enregistrer les paiements"}
        </button>
      </form>
    </div>
  );
}
