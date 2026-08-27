import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Heart,
  Landmark,
  MailCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "CERFA automatiques",
    text: "Reçus fiscaux générés depuis les dons, avec PDF prêt à envoyer.",
  },
  {
    icon: QrCode,
    title: "Liens de don",
    text: "Une page claire pour chaque campagne, partageable par lien ou QR code.",
  },
  {
    icon: MailCheck,
    title: "Email association",
    text: "Les donateurs reçoivent leurs documents depuis l’adresse de l’association.",
  },
  {
    icon: Landmark,
    title: "Paiement connecté",
    text: "Carte bancaire et prélèvement bancaire avec les comptes de l’association.",
  },
];

const trustItems = [
  "Données donateurs centralisées",
  "Suivi des campagnes en temps réel",
  "Interface pensée pour ordinateur et téléphone",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Heart size={20} />
            </span>
            <span className="whitespace-nowrap text-base font-bold text-slate-900 sm:text-lg">Trouma-Pro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-4"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-4"
            >
              <span className="sm:hidden">Créer</span>
              <span className="hidden sm:inline">Créer un espace</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              CRM dons, paiements et reçus fiscaux
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
              Trouma-Pro
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              La plateforme qui aide les associations à collecter les dons, suivre les donateurs et envoyer les CERFA sans perdre des heures sur les fichiers.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Créer un espace association
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Se connecter
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3 shadow-2xl">
            <div className="rounded-xl bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Campagne</p>
                  <p className="text-lg font-bold text-slate-900">Solidarité 2026</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Active
                </span>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Collecté</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">18 420 €</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <QrCode size={34} />
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-3/4 rounded-full bg-blue-600" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <CreditCard size={18} className="text-blue-600" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Paiements</p>
                  <p className="text-lg font-bold text-slate-900">Carte + SEPA</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <FileText size={18} className="text-emerald-600" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">CERFA</p>
                  <p className="text-lg font-bold text-slate-900">Auto</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">Dernier don</p>
                    <p className="truncate text-sm font-bold text-slate-800">David F. vient de recevoir son CERFA</p>
                  </div>
                  <MailCheck size={22} className="shrink-0 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">Tout au même endroit</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Une collecte plus simple pour l&apos;association</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Trouma-Pro garde le côté administratif discret, pour que l&apos;équipe puisse se concentrer sur la cause.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
                <Icon size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Smartphone size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950">Prêt pour les dons sur mobile</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Les pages de campagne sont pensées pour être envoyées par WhatsApp, SMS, email ou QR code.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Démarrer
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
