"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Baby,
  CalendarDays,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Link2,
  Loader2,
  Monitor,
  Plus,
  QrCode,
  Search,
  Smartphone,
  Soup,
  Sparkles,
  Trophy,
  Tv,
  Users,
  WalletCards,
} from "lucide-react";

interface Gala {
  id: string;
  titre: string;
  objectif: number;
  totalCollecte: number;
  dateEvenement: string;
  lieu: string | null;
  logoUrl: string | null;
  typeProjet: string;
  actif: boolean;
  promesseEnabled: boolean;
  _count: { dons: number };
}

const PROJECT_TYPES = [
  {
    value: "general",
    label: "Général",
    page: "/campagnes",
    icon: HeartHandshake,
    hint: "Collectes libres, soutien global, besoins ponctuels",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "", goal: "5000" },
  },
  {
    value: "mariage",
    label: "Mariages",
    page: "/campagnes/mariages",
    icon: Sparkles,
    hint: "Aide au mariage, trousseau, salle, installation",
    imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "Aide mariage", goal: "10000" },
  },
  {
    value: "orphelin",
    label: "Orphelins",
    page: "/campagnes/orphelins",
    icon: Baby,
    hint: "Parrainage, scolarité, vêtements, frais de vie",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "Soutien aux orphelins", goal: "18000" },
  },
  {
    value: "panier_repas",
    label: "Paniers repas",
    page: "/campagnes/paniers-repas",
    icon: Soup,
    hint: "Paniers alimentaires, chabbat, familles en difficulté",
    imageUrl: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "Paniers repas", goal: "7500" },
  },
  {
    value: "fetes",
    label: "Fêtes",
    page: "/campagnes/fetes",
    icon: Gift,
    hint: "Pessah, Roch Hachana, Hanouka, colis de fête",
    imageUrl: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "Aide pour les fêtes", goal: "12000" },
  },
  {
    value: "urgence",
    label: "Urgences",
    page: "/campagnes/urgences",
    icon: WalletCards,
    hint: "Loyers, soins, factures, situations critiques",
    imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80",
    defaults: { title: "Aide urgente", goal: "6000" },
  },
];

const PROGRESS_MILESTONES = [
  { value: 10, label: "Lancement", icon: Sparkles },
  { value: 15, label: "Élan pris", icon: HeartHandshake },
  { value: 25, label: "Quart atteint", icon: Gift },
  { value: 50, label: "Moitié", icon: Trophy },
  { value: 75, label: "Presque là", icon: Users },
  { value: 100, label: "Objectif", icon: CheckCircle2 },
];

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Réponse serveur invalide. Rechargez la page ou reconnectez-vous.");
  }
}

function getProjectType(value: string) {
  return PROJECT_TYPES.find(type => type.value === value) || PROJECT_TYPES[0];
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function getCampaignImage(gala: Gala) {
  return gala.logoUrl || getProjectType(gala.typeProjet).imageUrl;
}

function getProgress(gala: Gala) {
  if (!gala.objectif) return 0;
  return Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));
}

export default function GalaPage({ initialCategory = "tous" }: { initialCategory?: string } = {}) {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [typeProjet, setTypeProjet] = useState(initialCategory === "tous" ? "general" : initialCategory);
  const [promesseEnabled, setPromesseEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState(initialCategory);

  useEffect(() => {
    fetch("/api/gala")
      .then(async r => {
        if (r.status === 401 || r.redirected) {
          window.location.href = `/login?callbackUrl=${encodeURIComponent("/campagnes")}`;
          return [];
        }
        const d = await readJsonResponse(r);
        if (!r.ok || !Array.isArray(d)) throw new Error(d?.error || "Chargement des campagnes impossible");
        return d;
      })
      .then(d => { setGalas(d); setError(""); })
      .catch(e => setError(e instanceof Error ? e.message : "Chargement des campagnes impossible"))
      .finally(() => setLoading(false));
  }, []);

  function applyTemplate(value: string) {
    const template = getProjectType(value);
    setTypeProjet(value);
    if (!titre || PROJECT_TYPES.some(type => type.defaults.title === titre)) setTitre(template.defaults.title);
    if (!objectif || PROJECT_TYPES.some(type => type.defaults.goal === objectif)) setObjectif(template.defaults.goal);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/gala", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre, objectif, dateEvenement: date, lieu, typeProjet, promesseEnabled }),
    });
    const gala = await readJsonResponse(res);
    if (!res.ok || !gala?.id) {
      setSaving(false);
      setError(gala?.error || "Création de la campagne impossible");
      return;
    }
    setGalas(prev => [{ ...gala, _count: { dons: 0 } }, ...prev]);
    setSaving(false);
    setShowForm(false);
    setTitre("");
    setObjectif("");
    setDate("");
    setLieu("");
    setTypeProjet(initialCategory === "tous" ? "general" : initialCategory);
    setPromesseEnabled(false);
  }

  function copyLink(galaId: string) {
    const url = `${publicOrigin}/campagnes/${galaId}/don`;
    navigator.clipboard.writeText(url);
    setCopiedId(galaId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const publicOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const stats = useMemo(() => ({
    count: galas.length,
    active: galas.filter(g => g.actif).length,
    total: galas.reduce((sum, g) => sum + g.totalCollecte, 0),
    donors: galas.reduce((sum, g) => sum + (g._count?.dons || 0), 0),
  }), [galas]);

  const filteredGalas = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return galas.filter(g => {
      const typeOk = selectedType === "tous" || g.typeProjet === selectedType;
      const queryOk = !lowerQuery || [g.titre, g.lieu, getProjectType(g.typeProjet).label]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(lowerQuery));
      return typeOk && queryOk;
    });
  }, [galas, query, selectedType]);

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        {error}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <Tv size={20} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Campagnes de dons</h1>
            <p className="text-slate-500 text-sm mt-1">Organiser les collectes par projet et partager les liens Trouma Pro.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-800 transition-colors">
          <Plus size={16} /> Nouvelle campagne
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4"><p className="text-xs text-slate-500">Campagnes</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.count}</p></div>
        <div className="bg-white border border-slate-200 rounded-lg p-4"><p className="text-xs text-slate-500">Actives</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.active}</p></div>
        <div className="bg-white border border-slate-200 rounded-lg p-4"><p className="text-xs text-slate-500">Collecté</p><p className="text-2xl font-bold text-slate-900 mt-1">{fmt(stats.total)}</p></div>
        <div className="bg-white border border-slate-200 rounded-lg p-4"><p className="text-xs text-slate-500">Dons reçus</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.donors}</p></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une campagne, un lieu, un type..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedType("tous")} className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selectedType === "tous" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>Tout</button>
            {PROJECT_TYPES.map(type => (
              <button key={type.value} onClick={() => setSelectedType(type.value)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selectedType === type.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        {PROJECT_TYPES.filter(type => type.value !== "general").map(type => {
          const Icon = type.icon;
          const count = galas.filter(g => g.typeProjet === type.value).length;
          return (
            <Link key={type.value} href={type.page}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
              <img src={type.imageUrl} alt="" className="w-full h-24 object-cover" />
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 ml-4 mt-4">
                  <Icon size={18} className="text-slate-700" />
                </div>
                <div className="min-w-0 p-4 pl-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900 text-sm">{type.label}</h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.hint}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">Nouvelle campagne</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-800">Fermer</button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">Type de projet</label>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
              {PROJECT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button key={type.value} type="button" onClick={() => applyTemplate(type.value)}
                    className={`min-h-20 border rounded-lg p-3 text-left transition-colors ${typeProjet === type.value ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <Icon size={16} className={typeProjet === type.value ? "text-emerald-700" : "text-slate-500"} />
                    <p className="text-xs font-semibold text-slate-800 mt-2">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <input required value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de la campagne *"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required type="number" value={objectif} onChange={e => setObjectif(e.target.value)} placeholder="Objectif (€) *" min="1"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
            <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
          </div>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Lieu (optionnel)"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />

          <div className="border border-slate-200 rounded-lg p-4 space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={promesseEnabled} onChange={e => setPromesseEnabled(e.target.checked)} className="w-4 h-4" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Activer les promesses de don</p>
                <p className="text-xs text-slate-400 mt-0.5">Le donateur peut s'engager maintenant et l'association le recontacte ensuite.</p>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Créer
            </button>
          </div>
        </form>
      )}

      {filteredGalas.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-lg">
          <Tv size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucune campagne dans cette sélection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredGalas.map(g => {
            const pct = getProgress(g);
            const type = getProjectType(g.typeProjet);
            const Icon = type.icon;
            const imageUrl = getCampaignImage(g);
            const unlockedCount = PROGRESS_MILESTONES.filter(milestone => pct >= milestone.value).length;
            const donUrl = `${publicOrigin}/campagnes/${g.id}/don`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(donUrl)}`;
            return (
              <div key={g.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <img src={imageUrl} alt="" className="w-full h-40 object-cover" />
                <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-900 truncate">{g.titre}</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{type.label}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(g.dateEvenement).toLocaleDateString("fr-FR")}</span>
                        {g.lieu && <span>{g.lieu}</span>}
                        <span className="flex items-center gap-1"><Users size={12} />{g._count.dons} dons</span>
                      </div>
                    </div>
                  </div>
                  <span className={`w-fit text-xs px-2 py-1 rounded-full font-medium ${g.actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {g.actif ? "En cours" : "Inactif"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{fmt(g.totalCollecte)}</span>
                    <span className="text-slate-400">{pct}% de {fmt(g.objectif)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-600">Paliers débloqués</p>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      {unlockedCount}/{PROGRESS_MILESTONES.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PROGRESS_MILESTONES.map(milestone => {
                      const MilestoneIcon = milestone.icon;
                      const unlocked = pct >= milestone.value;
                      return (
                        <div key={milestone.value}
                          className={`min-h-20 rounded-lg border p-2 text-center transition-colors ${unlocked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${unlocked ? "bg-emerald-600 text-white" : "bg-white text-slate-300"}`}>
                            <MilestoneIcon size={15} />
                          </div>
                          <p className="text-sm font-black mt-1">{milestone.value}%</p>
                          <p className="text-[10px] font-semibold leading-tight">{unlocked ? "Débloqué" : milestone.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <a href={`/campagnes/${g.id}/ecran`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-slate-800 text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors">
                    <Monitor size={13} /> Projecteur
                  </a>
                  <a href={`/campagnes/${g.id}/saisie`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-emerald-700 text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors">
                    <Smartphone size={13} /> Saisie staff
                  </a>
                  <a href={`/campagnes/${g.id}`}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                    Modifier
                  </a>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <img src={qrUrl} alt="QR code don" className="w-24 h-24 sm:w-20 sm:h-20 rounded-lg shrink-0 mx-auto sm:mx-0" />
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center justify-center sm:justify-start gap-1">
                      <QrCode size={12} /> Lien de don
                    </p>
                    <p className="text-xs font-mono text-slate-500 break-all">{donUrl}</p>
                    <button onClick={() => copyLink(g.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      <Link2 size={12} />
                      {copiedId === g.id ? "Copié !" : "Copier le lien"}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
