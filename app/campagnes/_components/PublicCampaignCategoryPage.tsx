import Link from "next/link";
import { ArrowRight, CalendarDays, HeartHandshake, MapPin, ShieldCheck, Users } from "lucide-react";
import { prisma } from "@/lib/db";

const CATEGORY_IMAGES: Record<string, string> = {
  mariage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1800&q=85",
  orphelin: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=85",
  panier_repas: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1800&q=85",
  fetes: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1800&q=85",
  urgence: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1800&q=85",
};

type CategoryConfig = {
  type: string;
  title: string;
  subtitle: string;
  emptyText: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function pct(total: number, objectif: number) {
  if (!objectif) return 0;
  return Math.min(100, Math.round((total / objectif) * 100));
}

export default async function PublicCampaignCategoryPage({ config }: { config: CategoryConfig }) {
  const campagnes = await prisma.gala.findMany({
    where: { typeProjet: config.type, actif: true },
    include: { _count: { select: { dons: true } } },
    orderBy: [{ totalCollecte: "desc" }, { createdAt: "desc" }],
  });

  const imageUrl = CATEGORY_IMAGES[config.type] || CATEGORY_IMAGES.mariage;
  const totalCollecte = campagnes.reduce((sum, campagne) => sum + campagne.totalCollecte, 0);
  const totalObjectif = campagnes.reduce((sum, campagne) => sum + campagne.objectif, 0);
  const totalDons = campagnes.reduce((sum, campagne) => sum + campagne._count.dons, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[58vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.25),rgba(15,23,42,0.96))]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-20 sm:px-6 lg:px-8">
          <Link href="/login" className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 sm:right-6 lg:right-8">
            Espace association
          </Link>
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-bold text-white/85 backdrop-blur">
              <HeartHandshake size={14} /> Trouma Pro
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{config.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">{config.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Collecté</p>
              <p className="mt-1 text-lg font-black sm:text-2xl">{fmt(totalCollecte)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Objectif</p>
              <p className="mt-1 text-lg font-black sm:text-2xl">{fmt(totalObjectif)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dons</p>
              <p className="mt-1 text-lg font-black sm:text-2xl">{totalDons}</p>
            </div>
          </div>

          {campagnes.length === 0 ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">{config.emptyText}</p>
              <Link href="/login" className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
                Connexion association
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {campagnes.map(campagne => {
                const progress = pct(campagne.totalCollecte, campagne.objectif);
                const cardImage = campagne.logoUrl || imageUrl;
                return (
                  <article key={campagne.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <img src={cardImage} alt="" className="h-44 w-full object-cover sm:h-56" />
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-black text-slate-900">{campagne.titre}</h2>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{new Date(campagne.dateEvenement).toLocaleDateString("fr-FR")}</span>
                            {campagne.lieu && <span className="inline-flex items-center gap-1"><MapPin size={13} />{campagne.lieu}</span>}
                            <span className="inline-flex items-center gap-1"><Users size={13} />{campagne._count.dons} dons</span>
                          </div>
                        </div>
                        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{progress}%</span>
                      </div>

                      {campagne.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{campagne.description}</p>
                      )}

                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                          <span>{fmt(campagne.totalCollecte)}</span>
                          <span>{fmt(campagne.objectif)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(progress, 1)}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                        <Link href={`/campagnes/${campagne.id}/don`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
                          Faire un don <ArrowRight size={15} />
                        </Link>
                        <Link href={`/campagnes/${campagne.id}/don`} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                          Voir la cause
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 px-2 py-8 text-center text-xs font-semibold text-slate-400">
            <ShieldCheck size={14} /> Paiement sécurisé via les moyens activés par l'association
          </p>
        </div>
      </section>
    </main>
  );
}
