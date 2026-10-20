"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Building2, CalendarDays, Check, ChevronDown, CreditCard, Heart,
  Loader2, MessageCircle, Share2, ShieldCheck,
} from "lucide-react";

interface Don {
  id: string;
  montant: number;
  nomAffiche: string | null;
  anonyme: boolean;
  message: string | null;
  createdAt: string;
}

interface Organizer {
  nom: string | null;
  presentation: string | null;
  email: string | null;
  telephone: string | null;
  remiseFondsDescription: string | null;
  organismeEligibleMecenat: boolean;
}

interface Gala {
  id: string;
  titre: string;
  description: string | null;
  videoUrl: string | null;
  objectif: number;
  totalCollecte: number;
  dateEvenement: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  promesseEnabled: boolean;
  lieu: string | null;
  logoUrl: string | null;
  typeProjet?: string | null;
  publicDonationUrl?: string;
  organizer?: Organizer | null;
  paymentMethods?: { stripeReady?: boolean; gocardlessReady?: boolean };
  dons: Don[];
}

const FEATURED_CAMPAIGN_ID = "cmtj8rao3000004l41t2zn3rc";
const FEATURED_COPY = {
  title: "Aidons une jeune orpheline à préparer son mariage",
  subtitle: "Son père ne sera pas là sous la ‘houppa. Ensemble, entourons-la de solidarité.",
  summary: "Une jeune fille en Israël s’apprête à se marier. Depuis le décès de son père, sa maman assume seule les besoins de la famille. Aidons-les à faire face aux dépenses du mariage et à vivre cette journée avec dignité et sérénité.",
  details: [
    "À l’approche du mariage, de nombreux frais restent à financer. Cette collecte a pour objectif de soulager sa maman et d’aider cette jeune kalla à commencer sa nouvelle vie plus sereinement.",
    "Chaque participation compte, quel que soit son montant. Si vous ne pouvez pas donner, partager cette collecte est déjà une aide précieuse.",
    "Merci du fond du cœur pour votre générosité. Que cette mitsva soit une source de bénédictions et de belles semahot pour vous et vos proches.",
  ],
};
const MONTANTS = [18, 36, 50, 100, 180, 360];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function getRemainingTime(targetDate: string) {
  const difference = Math.max(0, new Date(targetDate).getTime() - Date.now());
  const totalSeconds = Math.floor(difference / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    finished: difference === 0,
  };
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState(() => getRemainingTime(targetDate));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemainingTime(targetDate)), 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (remaining.finished) {
    return <p className="mt-3 text-sm font-extrabold text-white">Le grand jour est arrivé</p>;
  }

  const units = [
    { label: "jours", value: remaining.days, prefix: "J-" },
    { label: "heures", value: remaining.hours },
    { label: "minutes", value: remaining.minutes },
    { label: "secondes", value: remaining.seconds },
  ];

  return (
    <div className="mt-3 flex max-w-xl gap-2" aria-label={`Compte à rebours : ${remaining.days} jours, ${remaining.hours} heures, ${remaining.minutes} minutes et ${remaining.seconds} secondes`} aria-live="off">
      {units.map(unit => (
        <div key={unit.label} className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/45 px-2 py-2 text-center backdrop-blur-sm">
          <p className="text-base font-black tabular-nums text-white sm:text-lg">{unit.prefix}{String(unit.value).padStart(unit.prefix ? 1 : 2, "0")}</p>
          <p className="mt-0.5 truncate text-[10px] font-bold uppercase text-white/70 sm:text-xs">{unit.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function DonPage() {
  const { id } = useParams<{ id: string }>();
  const [gala, setGala] = useState<Gala | null>(null);
  const [loadError, setLoadError] = useState("");
  const [montant, setMontant] = useState("");
  const [montantLibre, setMontantLibre] = useState("");
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
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [cerfaDemande, setCerfaDemande] = useState(false);
  const [modePaiement, setModePaiement] = useState<"stripe" | "sepa">("stripe");
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadGala() {
      try {
        const res = await fetch(`/api/gala/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Campagne introuvable");
        if (mounted) {
          setGala(data);
          setLoadError("");
        }
      } catch (error) {
        if (mounted) setLoadError(error instanceof Error ? error.message : "Chargement impossible");
      }
    }
    loadGala();
    const timer = window.setInterval(loadGala, 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const montantFinal = montantLibre || montant;
  const montantNombre = Number(montantFinal);
  const fmt = (value: number) => new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(value);
  const stripeReady = !!gala?.paymentMethods?.stripeReady;
  const gocardlessReady = !!gala?.paymentMethods?.gocardlessReady;
  const selectedPaymentMode = stripeReady
    ? (modePaiement === "sepa" && gocardlessReady ? "sepa" : "stripe")
    : "sepa";
  const receiptAvailable = !!gala?.organizer?.organismeEligibleMecenat;
  const featured = gala?.id === FEATURED_CAMPAIGN_ID;
  const displayTitle = featured ? FEATURED_COPY.title : (gala?.titre || "");
  const displaySubtitle = featured ? FEATURED_COPY.subtitle : (gala?.lieu || "Ensemble, faisons grandir cette collecte.");

  function chooseAmount(value: number) {
    setMontant(String(value));
    setMontantLibre("");
    setCheckoutError("");
  }

  function changeCustomAmount(value: string) {
    setMontantLibre(value);
    if (value) setMontant("");
    setCheckoutError("");
  }

  async function handleShare() {
    if (!gala) return;
    const url = gala.publicDonationUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayTitle, text: displaySubtitle, url });
        setShareStatus("Partage ouvert");
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Lien copié");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Lien copié");
      } catch {
        setShareStatus("Copie impossible");
      }
    }
    window.setTimeout(() => setShareStatus(""), 2200);
  }

  async function handlePayer(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!Number.isFinite(montantNombre) || montantNombre <= 0 || montantNombre > 1_000_000) {
      setCheckoutError("Choisissez un montant compris entre 1 € et 1 000 000 €.");
      return;
    }
    setCheckoutError("");
    setLoading(true);

    try {
      const payload = {
        montant: String(montantNombre), montantMensuel: String(montantNombre),
        nomAffiche: anonyme ? "" : nomAffiche, anonyme, message, type: typePersonne,
        prenom: typePersonne === "particulier" ? prenom : prenomContact,
        nom: typePersonne === "particulier" ? nom : nomContact,
        raisonSociale: typePersonne === "societe" ? raisonSociale : "",
        siret: typePersonne === "societe" ? siret : "", email,
        adresse: cerfaDemande ? adresse : "", codePostal: cerfaDemande ? codePostal : "",
        ville: cerfaDemande ? ville : "", cerfaDemande, modePaiement: selectedPaymentMode, nbFois: 1,
      };
      const res = await fetch(`/api/gala/${id}/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Impossible de lancer le paiement.");
      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Impossible de lancer le paiement.");
      setLoading(false);
    }
  }

  if (!gala) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
        {loadError ? <div role="alert" className="max-w-md rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm">{loadError}</div>
          : <Loader2 className="h-9 w-9 animate-spin text-blue-700" aria-label="Chargement" />}
      </main>
    );
  }

  const displaySummary = featured ? FEATURED_COPY.summary : (gala.description || "Chaque participation compte.");
  const detailParagraphs = featured ? FEATURED_COPY.details : (gala.description ? [gala.description] : []);
  const pct = gala.objectif > 0 ? Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100)) : 0;
  const donsRecents = (gala.dons || []).slice(0, 8);
  const eventDateValue = new Date(gala.dateEvenement);
  const eventDay = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Europe/Paris" }).format(eventDateValue);
  const eventMonthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(eventDateValue);
  const eventDate = `${eventDay === "1" ? "1er" : eventDay} ${eventMonthYear}`;
  const backgroundImage = getBackgroundImage(gala);
  const buttonLabel = montantNombre > 0 ? `Donner ${fmt(montantNombre)}` : "Choisir un montant";

  return (
    <main className="min-h-screen bg-[#090b10] text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.78fr)] lg:gap-7 lg:px-8 lg:py-8">
        <section className="relative min-h-[520px] overflow-hidden rounded-2xl bg-slate-900 shadow-xl sm:min-h-[590px] lg:col-start-1 lg:row-start-1 lg:min-h-[680px]" aria-label="Photo de la campagne">
          <div className="absolute inset-0 bg-cover bg-[position:64%_center] sm:bg-[position:66%_center] lg:bg-[position:62%_center]" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.01)_16%,rgba(0,0,0,0.08)_50%,rgba(0,0,0,0.76)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[49%] bg-black/58 sm:hidden" />
          <div className="absolute inset-x-0 bottom-0 max-w-3xl p-5 text-white sm:p-8 lg:p-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/35 px-3 py-1.5 text-xs font-bold backdrop-blur-sm"><Heart size={13} aria-hidden="true" /> Campagne solidaire</div>
            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl lg:max-w-[56%] lg:text-4xl">{displayTitle}</h1>
            <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-white/90 sm:text-lg lg:max-w-[56%]">{displaySubtitle}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-blue-950 shadow-sm"><CalendarDays size={16} aria-hidden="true" /> Mariage prévu le {eventDate}</div>
            <Countdown key={gala.dateEvenement} targetDate={gala.dateEvenement} />
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl sm:p-7 lg:sticky lg:top-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm leading-relaxed text-slate-600">{displaySummary}</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collecté</p><p className="text-3xl font-extrabold text-blue-950">{fmt(gala.totalCollecte)}</p></div>
              <p className="text-right text-sm font-semibold text-slate-600">Objectif {fmt(gala.objectif)}</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-blue-100" aria-label={`${pct}% de l'objectif atteint`}><div className="h-full rounded-full bg-blue-700 transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%` }} /></div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-blue-800">{pct}% atteint</span>
              <button type="button" onClick={handleShare} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100">{shareStatus === "Lien copié" ? <Check size={16} /> : <Share2 size={16} />}{shareStatus || "Partager la collecte"}</button>
            </div>
          </div>

          <form onSubmit={handlePayer} className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-base font-extrabold text-slate-900">Choisissez votre montant</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {MONTANTS.map(value => {
                  const selected = montant === String(value) && !montantLibre;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => chooseAmount(value)} className={`min-h-12 rounded-xl border-2 px-2 text-base font-extrabold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${selected ? "border-blue-700 bg-blue-700 text-white shadow-md" : "border-blue-100 bg-blue-50 text-blue-950 hover:border-blue-300 hover:bg-blue-100"}`}>{value} €</button>;
                })}
              </div>
              <Field label="Autre montant">
                <div className="relative mt-3"><input type="number" min="1" max="1000000" step="1" inputMode="numeric" value={montantLibre} onChange={event => changeCustomAmount(event.target.value)} placeholder="Montant libre" aria-describedby="amount-help" className={`${inputClass} pr-10`} /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">€</span></div>
              </Field>
              <p id="amount-help" className="mt-2 text-xs text-slate-500">Montant compris entre 1 € et 1 000 000 €.</p>
            </fieldset>

            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-base font-extrabold text-slate-900">Vos informations</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Type de donateur">
                <button type="button" onClick={() => setTypePersonne("particulier")} aria-pressed={typePersonne === "particulier"} className={`min-h-11 rounded-lg text-sm font-bold transition ${typePersonne === "particulier" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`}>Particulier</button>
                <button type="button" onClick={() => setTypePersonne("societe")} aria-pressed={typePersonne === "societe"} className={`min-h-11 rounded-lg text-sm font-bold transition ${typePersonne === "societe" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`}>Société</button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {typePersonne === "particulier" ? <><Field label="Prénom"><input required autoComplete="given-name" value={prenom} onChange={event => setPrenom(event.target.value)} className={inputClass} /></Field><Field label="Nom"><input required autoComplete="family-name" value={nom} onChange={event => setNom(event.target.value)} className={inputClass} /></Field></>
                  : <><Field label="Raison sociale"><input required autoComplete="organization" value={raisonSociale} onChange={event => setRaisonSociale(event.target.value)} className={inputClass} /></Field><Field label="SIRET"><input required inputMode="numeric" value={siret} onChange={event => setSiret(event.target.value)} className={inputClass} /></Field><Field label="Prénom du contact"><input required autoComplete="given-name" value={prenomContact} onChange={event => setPrenomContact(event.target.value)} className={inputClass} /></Field><Field label="Nom du contact"><input required autoComplete="family-name" value={nomContact} onChange={event => setNomContact(event.target.value)} className={inputClass} /></Field></>}
              </div>
              <div className="mt-4"><Field label="Email"><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} /></Field></div>
            </div>

            {receiptAvailable && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-blue-950"><input type="checkbox" checked={cerfaDemande} onChange={event => setCerfaDemande(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-blue-300 text-blue-700 focus:ring-blue-500" /><span>Je souhaite recevoir un reçu fiscal</span></label>
              {cerfaDemande && <div className="mt-4 grid gap-4"><p className="text-xs leading-relaxed text-blue-900">Votre adresse est nécessaire pour établir le reçu fiscal. Celui-ci sera envoyé par email après confirmation du paiement.</p><Field label="Adresse"><input required autoComplete="street-address" value={adresse} onChange={event => setAdresse(event.target.value)} className={inputClass} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Code postal"><input required autoComplete="postal-code" inputMode="numeric" value={codePostal} onChange={event => setCodePostal(event.target.value)} className={inputClass} /></Field><Field label="Ville"><input required autoComplete="address-level2" value={ville} onChange={event => setVille(event.target.value)} className={inputClass} /></Field></div></div>}
            </div>}

            <details className="group rounded-xl border border-slate-200 bg-slate-50">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100">Personnaliser mon don<ChevronDown size={18} className="transition group-open:rotate-180" aria-hidden="true" /></summary>
              <div className="space-y-4 border-t border-slate-200 p-4">
                <Field label="Nom affiché publiquement"><input value={nomAffiche} onChange={event => setNomAffiche(event.target.value)} disabled={anonyme} className={inputClass} placeholder="Facultatif" /></Field>
                <Field label="Message de soutien"><textarea rows={3} value={message} onChange={event => setMessage(event.target.value)} className={`${inputClass} resize-y`} placeholder="Facultatif" /></Field>
                <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={anonyme} onChange={event => setAnonyme(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500" /><span>Ne pas afficher mon nom publiquement<span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500">Cette option masque votre nom sur la page publique. L’organisateur et le prestataire de paiement reçoivent toujours les informations nécessaires au traitement du don.</span></span></label>
              </div>
            </details>

            <fieldset>
              <legend className="text-sm font-extrabold text-slate-900">Moyen de paiement</legend>
              {stripeReady || gocardlessReady ? <div className={`mt-3 grid gap-2 ${stripeReady && gocardlessReady ? "grid-cols-2" : "grid-cols-1"}`}>
                {stripeReady && <button type="button" onClick={() => setModePaiement("stripe")} aria-pressed={selectedPaymentMode === "stripe"} className={`min-h-12 rounded-xl border-2 px-3 text-sm font-bold transition ${selectedPaymentMode === "stripe" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700"}`}><span className="flex items-center justify-center gap-2"><CreditCard size={17} /> Carte bancaire</span></button>}
                {gocardlessReady && <button type="button" onClick={() => setModePaiement("sepa")} aria-pressed={selectedPaymentMode === "sepa"} className={`min-h-12 rounded-xl border-2 px-3 text-sm font-bold transition ${selectedPaymentMode === "sepa" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700"}`}><span className="flex items-center justify-center gap-2"><Building2 size={17} /> Pay by Bank</span></button>}
              </div> : <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Aucun moyen de paiement en ligne n’est actuellement disponible.</p>}
              <p className="mt-3 flex gap-2 text-xs leading-relaxed text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0" />{selectedPaymentMode === "sepa" ? "Le paiement est validé dans votre banque via GoCardless." : "Le paiement par carte est traité par Stripe sur son interface sécurisée."}</p>
            </fieldset>

            {checkoutError && <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{checkoutError}</div>}
            <button type="submit" disabled={loading || !Number.isFinite(montantNombre) || montantNombre <= 0 || (!stripeReady && !gocardlessReady)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{loading && <Loader2 size={19} className="animate-spin" />}{loading ? "Redirection…" : buttonLabel}</button>
          </form>
        </section>

        <section className="space-y-5 lg:col-start-1 lg:row-start-2">
          {detailParagraphs.length > 0 && <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7"><h2 className="flex items-center gap-2 text-xl font-extrabold text-blue-950"><Heart size={20} /> Pourquoi cette collecte ?</h2><div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">{detailParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article>}
          {donsRecents.length > 0 && <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-extrabold text-slate-900">Dons récents</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{donsRecents.map(don => <div key={don.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{don.anonyme ? "Donateur anonyme" : (don.nomAffiche || "Donateur")}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(don.createdAt).toLocaleDateString("fr-FR")}</p></div><span className="shrink-0 font-extrabold text-blue-800">{fmt(don.montant)}</span></div>{don.message && <p className="mt-3 flex gap-2 text-sm leading-relaxed text-slate-600"><MessageCircle size={15} className="mt-0.5 shrink-0 text-blue-600" /> {don.message}</p>}</div>)}</div></article>}
        </section>
      </div>
    </main>
  );
}
