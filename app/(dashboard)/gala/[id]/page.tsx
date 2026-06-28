"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Monitor, Smartphone, QrCode, Link2, FileDown } from "lucide-react";

interface Gala {
  id: string; titre: string; description: string | null; videoUrl: string | null;
  objectif: number; dateEvenement: string; lieu: string | null;
  couleurPrimaire: string; couleurSecondaire: string;
  promesseEnabled: boolean; mensualiteEnabled: boolean;
  mensualiteOptions: string; mensualiteDebutMode: string;
  mensualiteDebutDate: string | null; actif: boolean; totalCollecte: number;
}

const MENSUALITE_OPTIONS = [
  { value: "2", label: "2 fois" },
  { value: "3", label: "3 fois" },
  { value: "6", label: "6 fois" },
  { value: "12", label: "12 fois" },
];

export default function GalaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gala, setGala] = useState<Gala | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [objectif, setObjectif] = useState("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [lieu, setLieu] = useState("");
  const [couleurPrimaire, setCouleurPrimaire] = useState("#1e3a8a");
  const [couleurSecondaire, setCouleurSecondaire] = useState("#ffffff");
  const [actif, setActif] = useState(false);
  const [promesseEnabled, setPromesseEnabled] = useState(false);
  const [mensualiteEnabled, setMensualiteEnabled] = useState(false);
  const [mensualiteOptions, setMensualiteOptions] = useState<string[]>(["2", "3", "6", "12"]);
  const [mensualiteDebutMode, setMensualiteDebutMode] = useState<"immediat" | "date">("immediat");
  const [mensualiteDebutDate, setMensualiteDebutDate] = useState("");

  useEffect(() => {
    fetch(`/api/gala/${id}`).then(r => r.json()).then((g: Gala) => {
      setGala(g);
      setTitre(g.titre);
      setDescription(g.description || "");
      setVideoUrl(g.videoUrl || "");
      setObjectif(String(g.objectif));
      setDateEvenement(g.dateEvenement ? g.dateEvenement.slice(0, 16) : "");
      setLieu(g.lieu || "");
      setCouleurPrimaire(g.couleurPrimaire);
      setCouleurSecondaire(g.couleurSecondaire);
      setActif(g.actif);
      setPromesseEnabled(g.promesseEnabled);
      setMensualiteEnabled(g.mensualiteEnabled);
      setMensualiteOptions(g.mensualiteOptions ? g.mensualiteOptions.split(",") : ["2", "3", "6", "12"]);
      setMensualiteDebutMode(g.mensualiteDebutMode as "immediat" | "date");
      setMensualiteDebutDate(g.mensualiteDebutDate ? g.mensualiteDebutDate.slice(0, 10) : "");
    });
  }, [id]);

  function toggleMensualite(val: string) {
    setMensualiteOptions(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/gala/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre, description, videoUrl, objectif, dateEvenement, lieu,
        couleurPrimaire, couleurSecondaire, actif,
        promesseEnabled, mensualiteEnabled,
        mensualiteOptions: mensualiteOptions.join(","),
        mensualiteDebutMode,
        mensualiteDebutDate: mensualiteDebutMode === "date" && mensualiteDebutDate ? mensualiteDebutDate : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/gala/${id}/don`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (!gala) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const donUrl = typeof window !== "undefined" ? `${window.location.origin}/gala/${id}/don` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donUrl)}`;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const pct = Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push("/gala")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6">
        <ArrowLeft size={16} /> Retour aux galas
      </button>

      {/* Stats rapides */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-slate-800 text-lg">{gala.titre}</h1>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {actif ? "En cours" : "Inactif"}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold text-slate-800">{fmt(gala.totalCollecte)}</span>
          <span className="text-slate-400">{pct}% de {fmt(gala.objectif)}</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: couleurPrimaire }} />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <a href={`/gala/${id}/ecran`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold hover:bg-slate-700">
            <Monitor size={13} /> Projecteur
          </a>
          <a href={`/gala/${id}/saisie`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700">
            <Smartphone size={13} /> Saisie staff
          </a>
          <a href={`/gala/${id}/don`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-blue-700">
            Page dons
          </a>
        </div>
      </div>

      {/* QR code + lien */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><QrCode size={16} /> Lien & QR code donateurs</h2>
        <div className="flex items-center gap-5">
          <img src={qrUrl} alt="QR code" className="w-28 h-28 rounded-xl" />
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">Lien de don :</p>
            <p className="text-xs font-mono text-slate-600 break-all mb-3">{donUrl}</p>
            <div className="flex gap-2">
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                <Link2 size={12} /> {copiedLink ? "Copié !" : "Copier"}
              </button>
              <a href={`/api/gala/${id}/pdf/affiche`} target="_blank"
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                <FileDown size={12} /> Affiche PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire paramètres */}
      <form onSubmit={handleSave} className="space-y-4">

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Informations générales</h2>
          <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre *" required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Description de votre association / campagne (affichée sur la page de don)"
            rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Vidéo de présentation (lien YouTube ou Vimeo)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Objectif (€)</label>
              <input type="number" value={objectif} onChange={e => setObjectif(e.target.value)} min="1" required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date de l'événement</label>
              <input type="datetime-local" value={dateEvenement} onChange={e => setDateEvenement(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Lieu"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Couleur principale</label>
              <div className="flex items-center gap-2">
                <input type="color" value={couleurPrimaire} onChange={e => setCouleurPrimaire(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-sm text-slate-600">{couleurPrimaire}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Couleur secondaire</label>
              <div className="flex items-center gap-2">
                <input type="color" value={couleurSecondaire} onChange={e => setCouleurSecondaire(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-sm text-slate-600">{couleurSecondaire}</span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-700">Gala actif (visible en direct)</span>
          </label>
        </div>

        {/* Promesses de don */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={promesseEnabled} onChange={e => setPromesseEnabled(e.target.checked)} className="w-4 h-4 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Activer les promesses de don</p>
              <p className="text-xs text-slate-400 mt-0.5">Permet aux donateurs de s'engager à faire un don sans payer immédiatement. L'association les recontacte à la date choisie pour finaliser le paiement.</p>
            </div>
          </label>
        </div>

        {/* Paiement en plusieurs fois */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={mensualiteEnabled} onChange={e => setMensualiteEnabled(e.target.checked)} className="w-4 h-4 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Activer le paiement en plusieurs fois</p>
              <p className="text-xs text-slate-400 mt-0.5">Le donateur peut étaler son don sur plusieurs mois via prélèvement automatique Stripe.</p>
            </div>
          </label>

          {mensualiteEnabled && (
            <div className="space-y-4 pl-7 border-l-2 border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Échéances proposées</p>
                <div className="flex gap-2 flex-wrap">
                  {MENSUALITE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggleMensualite(opt.value)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={mensualiteOptions.includes(opt.value)
                        ? { backgroundColor: couleurPrimaire, color: "#fff" }
                        : { backgroundColor: "#f1f5f9", color: "#334155" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Date de début des prélèvements</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="debutMode" value="immediat"
                      checked={mensualiteDebutMode === "immediat"}
                      onChange={() => setMensualiteDebutMode("immediat")} className="w-4 h-4" />
                    <div>
                      <p className="text-sm text-slate-700 font-medium">Immédiatement</p>
                      <p className="text-xs text-slate-400">1er prélèvement au moment du don, puis le 1er de chaque mois suivant</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="debutMode" value="date"
                      checked={mensualiteDebutMode === "date"}
                      onChange={() => setMensualiteDebutMode("date")} className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 font-medium">Date fixe</p>
                      <p className="text-xs text-slate-400">Tous les prélèvements démarrent à la même date</p>
                    </div>
                  </label>
                  {mensualiteDebutMode === "date" && (
                    <input type="date" value={mensualiteDebutDate} onChange={e => setMensualiteDebutDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-7" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ backgroundColor: couleurPrimaire }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saved ? "Enregistré !" : "Enregistrer les paramètres"}
        </button>
      </form>
    </div>
  );
}
