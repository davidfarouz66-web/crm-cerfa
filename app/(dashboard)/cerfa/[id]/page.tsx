"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, User, Pencil, Ban, Loader2, Send, X, CheckCircle, Clock } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/utils";

const modeLabel: Record<string, string> = {
  virement: "Virement bancaire",
  cheque:   "Chèque",
  especes:  "Espèces",
  cb:       "Carte bancaire",
};

interface Cerfa {
  id: string; numeroCerfa: string; dateDon: string; montant: number;
  modePaiement: string; objetDon?: string; dateEmission: string; pdfPath?: string;
  sentAt?: string | null; status: string;
  donateurId: string;
  donateur: { nom: string; prenom?: string; raisonSociale?: string; type: string; ville?: string };
}

export default function CerfaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cerfa, setCerfa] = useState<Cerfa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/cerfa/${id}`).then((r) => {
      if (!r.ok) { router.replace("/cerfa"); return null; }
      return r.json();
    }).then((d) => { if (d) { setCerfa(d); setSendEmail(d.donateur?.email || ""); } });
  }, [id, router]);

  const handleSend = async () => {
    setSending(true);
    setSendResult(null);
    const res = await fetch(`/api/cerfa/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sendEmail }),
    });
    const data = await res.json();
    setSendResult(data);
    setSending(false);
    if (data.ok) setCerfa((prev) => prev ? { ...prev, sentAt: new Date().toISOString() } : prev);
  };

  const handleDelete = async () => {
    if (!confirm(`Annuler le CERFA ${cerfa?.numeroCerfa} ? Il sera conservé dans la base mais marqué comme annulé.`)) return;
    setDeleting(true);
    await fetch(`/api/cerfa/${id}`, { method: "DELETE" });
    setCerfa((prev) => prev ? { ...prev, status: "annulé" } : prev);
    setDeleting(false);
  };

  if (!cerfa) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nom = cerfa.donateur.type === "entreprise"
    ? cerfa.donateur.raisonSociale || cerfa.donateur.nom
    : `${cerfa.donateur.prenom || ""} ${cerfa.donateur.nom}`.trim();

  const fields = [
    { label: "N° CERFA",         value: cerfa.numeroCerfa },
    { label: "Date du don",      value: formatDate(cerfa.dateDon) },
    { label: "Montant",          value: formatMontant(cerfa.montant), highlight: true },
    { label: "Mode de paiement", value: modeLabel[cerfa.modePaiement] || cerfa.modePaiement },
    { label: "Objet du don",     value: cerfa.objetDon || "—" },
    { label: "Date d'émission",  value: formatDate(cerfa.dateEmission) },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 md:gap-3 mb-6">
        <Link href="/cerfa" className="p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className={`text-lg md:text-2xl font-bold truncate ${cerfa.status === "annulé" ? "text-slate-400 line-through" : "text-slate-800"}`}>
            {cerfa.numeroCerfa}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">Reçu fiscal</p>
            {cerfa.status === "annulé" && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <Ban size={11} /> Annulé
              </span>
            )}
            {cerfa.status === "actif" && cerfa.sentAt ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Envoyé le {formatDate(cerfa.sentAt)}
              </span>
            ) : cerfa.status === "actif" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                <Clock size={11} /> Non envoyé
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {cerfa.pdfPath && (
            <a href={cerfa.pdfPath} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Download size={15} />
              <span className="hidden sm:inline">PDF</span>
            </a>
          )}
          <button onClick={() => { setShowSendModal(true); setSendResult(null); }}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
            <Send size={15} />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
          <Link href={`/cerfa/${id}/edit`}
            className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            <Pencil size={15} />
            <span className="hidden sm:inline">Modifier</span>
          </Link>
          <button onClick={handleDelete} disabled={deleting || cerfa.status === "annulé"}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-2 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            <span className="hidden sm:inline">{cerfa.status === "annulé" ? "Annulé" : "Annuler"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center gap-3 mb-1">
          <User size={16} className="text-slate-400" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Donateur</p>
        </div>
        <Link href={`/donateurs/${cerfa.donateurId}`}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
          {nom}
        </Link>
        <p className="text-sm text-slate-500 mt-0.5">
          {cerfa.donateur.type === "entreprise" ? "Entreprise" : "Particulier"}
          {cerfa.donateur.ville ? ` · ${cerfa.donateur.ville}` : ""}
        </p>
      </div>

      {/* Modale envoi email */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Envoyer le CERFA par email</h2>
              <button onClick={() => setShowSendModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Le PDF <strong>{cerfa.numeroCerfa}</strong> sera envoyé en pièce jointe.
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email du destinataire</label>
            <input
              type="email" value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="donateur@exemple.fr"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            {sendResult?.ok && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                ✓ Email envoyé à <strong>{sendEmail}</strong>
              </div>
            )}
            {sendResult?.error && (
              <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                {sendResult.error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Fermer
              </button>
              <button onClick={handleSend} disabled={sending || !sendEmail}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-slate-500">{f.label}</span>
            <span className={`text-sm font-semibold ${f.highlight ? "text-blue-600 text-base" : "text-slate-800"}`}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
