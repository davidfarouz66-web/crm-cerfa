"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, CreditCard, Building2, User, FileText, CalendarClock, Heart, MessageCircle, ShieldCheck } from "lucide-react";

interface Don {
  id: string;
  montant: number;
  nomAffiche: string | null;
  anonyme: boolean;
  message: string | null;
  createdAt: string;
}

interface Gala {
  id: string; titre: string; description: string | null; videoUrl: string | null;
  objectif: number; totalCollecte: number;
  couleurPrimaire: string; couleurSecondaire: string;
  promesseEnabled: boolean; mensualiteEnabled: boolean;
  mensualiteOptions: string; mensualiteDebutMode: string;
  mensualiteDebutDate: string | null;
  lieu: string | null; logoUrl: string | null; typeProjet?: string | null;
  paymentMethods?: { stripeReady?: boolean; gocardlessReady?: boolean };
  dons: Don[];
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

const MONTANTS = [50, 100, 200, 500, 1000, 5000];

const BACKGROUND_IMAGES: Record<string, string> = {
  general: "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1800&q=85",
  mariage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1800&q=85",
  orphelin: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=85",
  panier_repas: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1800&q=85",
  fetes: "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1800&q=85",
  urgence: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1800&q=85",
};

function getBackgroundImage(gala: Gala) {
  return gala.logoUrl || BACKGROUND_IMAGES[gala.typeProjet || "general"] || BACKGROUND_IMAGES.general;
}

export default function DonPage() {
  const { id } = useParams<{ id: string }>();
  const [gala, setGala] = useState<Gala | null>(null);
  const [montant, setMontant] = useState("");
  const [montantLibre, setMontantLibre] = useState("");
  const [nbFois, setNbFois] = useState<number | null>(null);
  const [mode, setMode] = useState<"payer" | "promesse">("payer");
  const [typePersonne, setTypePersonne] = useState<"particulier" | "societe">("particulier");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [siret, setSiret] = useState("");
  const [prenomContact, setPrenomContact] = useState("");
  const [nomContact, setNomContact] = useState("");
  const [nomAffiche, setNomAffiche] = useState("");
  const [message, setMessage] = useState("");
  const [anonyme, setAnonyme] = useState(false);
  const [cerfaDemande, setCerfaDemande] = useState(false);
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateRappel, setDateRappel] = useState("");
  const [modePaiement, setModePaiement] = useState<"stripe" | "sepa">("stripe");
  const [loading, setLoading] = useState(false);
  const [promesseOk, setPromesseOk] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadGala() {
      const res = await fetch(`/api/gala/${id}`);
      const data = await res.json();
      if (mounted) setGala(data);
    }

    loadGala();
    const timer = window.setInterval(loadGala, 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const montantFinal = montant || montantLibre;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const mensualiteOpts = gala?.mensualiteOptions?.split(",").map(Number).filter(Boolean) || [];
  const montantMensuel = montantFinal ? parseFloat(montantFinal) : 0;
  const totalEngagement = nbFois ? montantMensuel * nbFois : montantMensuel;
  const stripeReady = !!gala?.paymentMethods?.stripeReady;
  const gocardlessReady = !!gala?.paymentMethods?.gocardlessReady;
  const showInstallmentOptions = mode === "promesse" && gala?.mensualiteEnabled && mensualiteOpts.length > 0 && montantFinal;

  useEffect(() => {
    if (!gala) return;
    if (!stripeReady && gocardlessReady) setModePaiement("sepa");
    if (stripeReady && !gocardlessReady) setModePaiement("stripe");
  }, [gala, stripeReady, gocardlessReady]);

  useEffect(() => {
    if (mode === "payer" && nbFois) setNbFois(null);
  }, [mode, nbFois]);

  async function handlePayer(e: React.FormEvent) {
    e.preventDefault();
    if (!montantFinal || parseFloat(montantFinal) <= 0) return;
    setCheckoutError("");
    setLoading(true);

    const payload = {
      montant: String(totalEngagement), montantMensuel: montantFinal, nomAffiche: anonyme ? "" : nomAffiche, anonyme,
      message,
      type: typePersonne,
      prenom: typePersonne === "particulier" ? prenom : prenomContact,
      nom: typePersonne === "particulier" ? nom : nomContact,
      raisonSociale: typePersonne === "societe" ? raisonSociale : "",
      siret: typePersonne === "societe" ? siret : "",
      email, adresse, codePostal, ville, cerfaDemande,
      modePaiement,
      nbFois: nbFois || 1,
      mensualiteDebutMode: gala?.mensualiteDebutMode,
      mensualiteDebutDate: gala?.mensualiteDebutDate,
    };

    const res = await fetch(`/api/gala/${id}/checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      setCheckoutError(data.error || "Impossible de lancer le paiement.");
      setLoading(false);
    }
  }

  async function handlePromesse(e: React.FormEvent) {
    e.preventDefault();
    if (!montantFinal || !dateRappel) return;
    setLoading(true);
    await fetch(`/api/gala/${id}/promesses`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        montant: String(totalEngagement), montantMensuel: montantFinal, nomAffiche: anonyme ? "" : nomAffiche, anonyme,
        message,
        type: typePersonne,
        prenom: typePersonne === "particulier" ? prenom : prenomContact,
        nom: typePersonne === "particulier" ? nom : nomContact,
        raisonSociale: typePersonne === "societe" ? raisonSociale : "",
        siret, telephone, email, adresse, codePostal, ville, cerfaDemande, dateRappel,
      }),
    });
    setLoading(false);
    setPromesseOk(true);
  }

  if (!gala) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (promesseOk) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarClock size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Promesse enregistrée !</h2>
        <p className="text-slate-500 text-sm">Merci pour votre engagement. L'association vous contactera le <strong>{new Date(dateRappel).toLocaleDateString("fr-FR")}</strong> pour finaliser votre don de <strong>{fmt(totalEngagement)}</strong>.</p>
      </div>
    </div>
  );

  const pct = Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));
  const donsRecents = (gala.dons || []).slice(0, 8);
  const donateurLabel = (don: Don) => don.anonyme ? "Donateur anonyme" : (don.nomAffiche || "Donateur");
  const backgroundImage = getBackgroundImage(gala);

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="fixed inset-0 bg-slate-950/70" />
      <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.25),rgba(15,23,42,0.9))]" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.75fr)] gap-5 lg:gap-6 items-start">
          <section className="space-y-4 lg:sticky lg:top-6">
            <div className="min-h-[46vh] md:min-h-[58vh] flex flex-col justify-end rounded-3xl overflow-hidden border border-white/15 bg-black/20 shadow-2xl">
              <div className="p-5 md:p-8 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <Heart size={13} /> Campagne de dons
                </div>
                <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">{gala.titre}</h1>
                {gala.lieu && <p className="mt-2 text-sm md:text-base text-white/75">{gala.lieu}</p>}
                <div className="mt-5 grid grid-cols-2 gap-3 max-w-xl">
                  <div className="rounded-2xl bg-white/14 border border-white/15 p-4 backdrop-blur">
                    <p className="text-xs text-white/65">Collecté</p>
                    <p className="text-2xl font-black">{fmt(gala.totalCollecte)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/14 border border-white/15 p-4 backdrop-blur">
                    <p className="text-xs text-white/65">Objectif</p>
                    <p className="text-2xl font-black">{fmt(gala.objectif)}</p>
                  </div>
                </div>
                <div className="mt-4 max-w-xl">
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{pct}% accompli</span>
                    <span>{fmt(Math.max(gala.objectif - gala.totalCollecte, 0))} restant</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Cause */}
            {(gala.description || donsRecents.length > 0) && (
              <div className="bg-white/95 backdrop-blur rounded-3xl border border-white/40 shadow-xl p-5 md:p-6">
                {gala.description && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${gala.couleurPrimaire}18`, color: gala.couleurPrimaire }}>
                        <Heart size={17} />
                      </div>
                      <h2 className="font-bold text-slate-800">La cause</h2>
                    </div>
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-line">{gala.description}</p>
                  </>
                )}

                {donsRecents.length > 0 && (
                  <div className={gala.description ? "mt-5 pt-5 border-t border-slate-100" : ""}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h2 className="font-bold text-slate-800 text-sm">Dons récents</h2>
                      <span className="text-xs font-semibold text-slate-400">{donsRecents.length} affichés</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {donsRecents.map(don => (
                        <div key={don.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-700 truncate">{donateurLabel(don)}</p>
                              <p className="text-[11px] text-slate-400">{new Date(don.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <span className="text-sm font-black shrink-0" style={{ color: gala.couleurPrimaire }}>{fmt(don.montant)}</span>
                          </div>
                          {don.message && (
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed flex gap-1.5">
                              <MessageCircle size={13} className="shrink-0 mt-0.5 text-slate-400" />
                              <span>{don.message}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {gala.videoUrl && getVideoEmbedUrl(gala.videoUrl) && (
              <div className="rounded-3xl overflow-hidden shadow-xl border border-white/20 bg-black" style={{ aspectRatio: "16/9" }}>
                <iframe src={getVideoEmbedUrl(gala.videoUrl)!} className="w-full h-full" allowFullScreen />
              </div>
            )}
          </section>

          <section className="space-y-4">
        <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: gala.couleurPrimaire }}>
              <span className="text-white font-bold text-lg">{gala.titre[0]}</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">{gala.titre}</h1>
              {gala.lieu && <p className="text-slate-400 text-sm">{gala.lieu}</p>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm mb-2">
            <span className="font-bold text-slate-800">{fmt(gala.totalCollecte)}</span>
            <span className="text-slate-400">{pct}% de {fmt(gala.objectif)}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: gala.couleurPrimaire }} />
          </div>
          <div className="flex justify-between text-xs text-slate-300 mt-1">
            <span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {/* Montant */}
        <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5">
          <p className="text-sm font-semibold text-slate-600 mb-3">Montant du don</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {MONTANTS.map(m => (
              <button key={m} type="button"
                onClick={() => { setMontant(String(m)); setMontantLibre(""); }}
                className="py-3 rounded-xl text-sm font-semibold transition-all"
                style={montant === String(m) ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                {m}€
              </button>
            ))}
          </div>
          <input type="number" value={montantLibre} onChange={e => { setMontantLibre(e.target.value); setMontant(""); }}
            placeholder="Autre montant (€)" min="1"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          {/* Mensualités */}
          {gala.mensualiteEnabled && mode === "payer" && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800 leading-relaxed">
              Le paiement en ligne est actuellement encaissé en don unique. Pour un engagement sur plusieurs mois, choisissez "Promesse de don" ; le vrai prélèvement mensuel GoCardless sera branché dans l'étape suivante.
            </div>
          )}

          {showInstallmentOptions && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Engagement sur plusieurs mois</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" onClick={() => setNbFois(null)}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={nbFois === null ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                  Don unique — {fmt(montantMensuel)}
                </button>
                {mensualiteOpts.map(n => (
                  <button key={n} type="button" onClick={() => setNbFois(n)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={nbFois === n ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                    {fmt(montantMensuel)}/mois pendant {n} mois
                  </button>
                ))}
              </div>
              {nbFois && (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-xs text-slate-500">Engagement total</p>
                  <p className="text-lg font-black text-slate-800">{fmt(totalEngagement)}</p>
                  <p className="text-xs text-slate-400">{fmt(montantMensuel)} x {nbFois} mois</p>
                </div>
              )}
              {nbFois && gala.mensualiteDebutMode === "date" && gala.mensualiteDebutDate && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Premier prélèvement le {new Date(gala.mensualiteDebutDate).toLocaleDateString("fr-FR")}
                </p>
              )}
              {nbFois && gala.mensualiteDebutMode === "immediat" && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  1er prélèvement aujourd'hui, puis le 1er de chaque mois
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mode : payer maintenant ou promesse */}
        {gala.promesseEnabled && (
          <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5">
            <p className="text-sm font-semibold text-slate-600 mb-3">Je souhaite…</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("payer")}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={mode === "payer" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                <CreditCard size={15} /> Payer maintenant
              </button>
              <button type="button" onClick={() => setMode("promesse")}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={mode === "promesse" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                <CalendarClock size={15} /> Promesse de don
              </button>
            </div>
            {mode === "promesse" && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700">Vous vous engagez à faire ce don. L'association vous contactera à la date choisie pour finaliser le paiement.</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={mode === "payer" ? handlePayer : handlePromesse} className="space-y-4">

          {/* Infos personnelles */}
          <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-600">Vos informations</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onClick={() => setTypePersonne("particulier")}
                className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={typePersonne === "particulier" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                <User size={14} /> Particulier
              </button>
              <button type="button" onClick={() => setTypePersonne("societe")}
                className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={typePersonne === "societe" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                <Building2 size={14} /> Société
              </button>
            </div>

            {typePersonne === "particulier" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input required value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom *"
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom *"
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ) : (
              <div className="space-y-2">
                <input required value={raisonSociale} onChange={e => setRaisonSociale(e.target.value)} placeholder="Raison sociale *"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={siret} onChange={e => setSiret(e.target.value)} placeholder="SIRET (optionnel)"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required value={prenomContact} onChange={e => setPrenomContact(e.target.value)} placeholder="Prénom contact *"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input required value={nomContact} onChange={e => setNomContact(e.target.value)} placeholder="Nom contact *"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}

            <input value={nomAffiche} onChange={e => setNomAffiche(e.target.value)}
              placeholder="Nom à afficher sur l'écran (optionnel)"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={anonyme} />
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Message de soutien affiché avec votre don (optionnel)"
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-600">Afficher anonymement sur l'écran</span>
            </label>
          </div>

          {/* Promesse : date + téléphone */}
          {mode === "promesse" && (
            <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-600">Date de rappel</p>
              <input required type="date" value={dateRappel} onChange={e => setDateRappel(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                placeholder="Téléphone *"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* CERFA */}
          <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={cerfaDemande} onChange={e => setCerfaDemande(e.target.checked)} className="w-4 h-4" />
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700 leading-snug">Je souhaite un reçu fiscal (CERFA)</span>
              </div>
            </label>
            {cerfaDemande && (
              <div className="space-y-2 pt-1">
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Adresse *"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required value={codePostal} onChange={e => setCodePostal(e.target.value)} placeholder="Code postal *"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input required value={ville} onChange={e => setVille(e.target.value)} placeholder="Ville *"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-slate-400">Le CERFA vous sera envoyé par email après votre don</p>
              </div>
            )}
          </div>

          {/* Paiement (mode payer uniquement) */}
          {mode === "payer" && (
            <div className="bg-white/96 backdrop-blur rounded-3xl border border-white/50 shadow-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-600">Moyen de paiement</p>
              {stripeReady || gocardlessReady ? (
                <div className={`grid grid-cols-1 ${stripeReady && gocardlessReady ? "sm:grid-cols-2" : ""} gap-2`}>
                  {stripeReady && (
                    <button type="button" onClick={() => setModePaiement("stripe")}
                      className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={modePaiement === "stripe" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                      <CreditCard size={15} /> Carte bancaire
                    </button>
                  )}
                  {gocardlessReady && (
                    <button type="button" onClick={() => setModePaiement("sepa")}
                      className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={modePaiement === "sepa" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                      <Building2 size={15} /> Paiement bancaire
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                  Aucun moyen de paiement en ligne n'est activé pour cette campagne.
                </div>
              )}
              {modePaiement === "sepa" && nbFois && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                  Le paiement bancaire GoCardless encaisse l'engagement total de {fmt(totalEngagement)} en une fois.
                </div>
              )}
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {checkoutError}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || !montantFinal || parseFloat(montantFinal) <= 0 || (mode === "payer" && !stripeReady && !gocardlessReady)}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ backgroundColor: gala.couleurPrimaire }}>
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === "promesse"
              ? `Enregistrer ma promesse de ${montantFinal ? fmt(totalEngagement) : "don"}`
              : `Faire un don de ${montantFinal ? fmt(totalEngagement) : "…"}`}
          </button>

          <p className="text-center text-xs text-white/75 pb-4 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} /> Paiement sécurisé — vos données ne sont jamais stockées sur nos serveurs
          </p>
        </form>
          </section>
        </div>
      </div>
    </div>
  );
}
