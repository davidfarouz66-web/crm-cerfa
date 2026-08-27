"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, CreditCard, Building2, User, FileText, CalendarClock } from "lucide-react";

interface Gala {
  id: string; titre: string; description: string | null; videoUrl: string | null;
  objectif: number; totalCollecte: number;
  couleurPrimaire: string; couleurSecondaire: string;
  promesseEnabled: boolean; mensualiteEnabled: boolean;
  mensualiteOptions: string; mensualiteDebutMode: string;
  mensualiteDebutDate: string | null;
  lieu: string | null; logoUrl: string | null;
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
    fetch(`/api/gala/${id}`).then(r => r.json()).then(setGala);
  }, [id]);

  const montantFinal = montant || montantLibre;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const mensualiteOpts = gala?.mensualiteOptions?.split(",").map(Number).filter(Boolean) || [];
  const mensualiteMontant = nbFois && montantFinal ? Math.round((parseFloat(montantFinal) / nbFois) * 100) / 100 : null;

  async function handlePayer(e: React.FormEvent) {
    e.preventDefault();
    if (!montantFinal || parseFloat(montantFinal) <= 0) return;
    setCheckoutError("");
    setLoading(true);

    const payload = {
      montant: montantFinal, nomAffiche: anonyme ? "" : nomAffiche, anonyme,
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
        montant: montantFinal, nomAffiche: anonyme ? "" : nomAffiche, anonyme,
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
        <p className="text-slate-500 text-sm">Merci pour votre engagement. L'association vous contactera le <strong>{new Date(dateRappel).toLocaleDateString("fr-FR")}</strong> pour finaliser votre don de <strong>{fmt(parseFloat(montantFinal))}</strong>.</p>
      </div>
    </div>
  );

  const pct = Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {gala.logoUrl && (
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white">
            <img src={gala.logoUrl} alt={gala.titre} className="w-full aspect-video object-cover" />
          </div>
        )}

        {/* Header campagne */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: gala.couleurPrimaire }}>
              <span className="text-white font-bold text-lg">{gala.titre[0]}</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">{gala.titre}</h1>
              {gala.lieu && <p className="text-slate-400 text-sm">{gala.lieu}</p>}
            </div>
          </div>
          <div className="flex justify-between text-sm mb-2">
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

        {/* Vidéo */}
        {gala.videoUrl && getVideoEmbedUrl(gala.videoUrl) && (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
            <iframe src={getVideoEmbedUrl(gala.videoUrl)!} className="w-full h-full" allowFullScreen />
          </div>
        )}

        {/* Description */}
        {gala.description && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{gala.description}</p>
          </div>
        )}

        {/* Montant */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-600 mb-3">Montant du don</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
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
          {gala.mensualiteEnabled && mensualiteOpts.length > 0 && montantFinal && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Payer en plusieurs fois</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setNbFois(null)}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={nbFois === null ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                  1 fois — {fmt(parseFloat(montantFinal))}
                </button>
                {mensualiteOpts.map(n => (
                  <button key={n} type="button" onClick={() => setNbFois(n)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={nbFois === n ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                    {n}x — {fmt(parseFloat(montantFinal) / n)}/mois
                  </button>
                ))}
              </div>
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-600 mb-3">Je souhaite…</p>
            <div className="grid grid-cols-2 gap-2">
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-600">Vos informations</p>
            <div className="grid grid-cols-2 gap-2">
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
              <div className="grid grid-cols-2 gap-2">
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
                <div className="grid grid-cols-2 gap-2">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-600">Afficher anonymement sur l'écran</span>
            </label>
          </div>

          {/* Promesse : date + téléphone */}
          {mode === "promesse" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={cerfaDemande} onChange={e => setCerfaDemande(e.target.checked)} className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Je souhaite un reçu fiscal (CERFA)</span>
              </div>
            </label>
            {cerfaDemande && (
              <div className="space-y-2 pt-1">
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Adresse *"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-2 gap-2">
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-600">Moyen de paiement</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setModePaiement("stripe")}
                  className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={modePaiement === "stripe" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                  <CreditCard size={15} /> Carte bancaire
                </button>
                <button type="button" onClick={() => setModePaiement("sepa")}
                  className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={modePaiement === "sepa" ? { backgroundColor: gala.couleurPrimaire, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                  <Building2 size={15} /> Paiement bancaire
                </button>
              </div>
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {checkoutError}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || !montantFinal || parseFloat(montantFinal) <= 0}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ backgroundColor: gala.couleurPrimaire }}>
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === "promesse"
              ? `Enregistrer ma promesse de ${montantFinal ? fmt(parseFloat(montantFinal)) : "don"}`
              : `Faire un don de ${montantFinal ? fmt(parseFloat(montantFinal)) : "…"}`}
          </button>

          <p className="text-center text-xs text-slate-400 pb-4">
            🔒 Paiement sécurisé — vos données ne sont jamais stockées sur nos serveurs
          </p>
        </form>
      </div>
    </div>
  );
}
