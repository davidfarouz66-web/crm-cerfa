"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

const LABELS: Record<string, Record<string, string>> = {
  fr: { objectif: "Objectif", collecte: "Collecté", dons: "dons", anonyme: "Donateur anonyme", merci: "Merci !" },
  en: { objectif: "Goal", collecte: "Raised", dons: "donations", anonyme: "Anonymous donor", merci: "Thank you!" },
  he: { objectif: "יעד", collecte: "נאסף", dons: "תרומות", anonyme: "תורם אנונימי", merci: "תודה רבה!" },
  ar: { objectif: "الهدف", collecte: "تم جمع", dons: "تبرعات", anonyme: "متبرع مجهول", merci: "شكراً جزيلاً!" },
};

interface Don { id: string; montant: number; nomAffiche: string | null; anonyme: boolean; message: string | null; createdAt: string; }
interface Gala { id: string; titre: string; objectif: number; totalCollecte: number; couleurPrimaire: string; couleurSecondaire: string; langue: string; logoUrl: string | null; lieu: string | null; dons: Don[]; }

export default function EcranGala() {
  const { id } = useParams<{ id: string }>();
  const [gala, setGala] = useState<Gala | null>(null);
  const [nouveauDon, setNouveauDon] = useState<Don | null>(null);

  const fetchGala = useCallback(async () => {
    const res = await fetch(`/api/gala/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setGala(prev => {
      if (prev && data.dons.length > prev.dons.length) {
        const nouveau = data.dons[0];
        setNouveauDon(nouveau);
        setTimeout(() => setNouveauDon(null), 4000);
      }
      return data;
    });
  }, [id]);

  useEffect(() => {
    fetchGala();
    const interval = setInterval(fetchGala, 3000);
    return () => clearInterval(interval);
  }, [fetchGala]);

  if (!gala) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const langue = LABELS[gala.langue] || LABELS.fr;
  const pct = Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));
  const isRTL = gala.langue === "he" || gala.langue === "ar";
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ backgroundColor: gala.couleurPrimaire, color: gala.couleurSecondaire, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8 pb-4">
        {gala.logoUrl && <img src={gala.logoUrl} alt="Logo" className="h-16 object-contain" />}
        <h1 className="text-4xl font-bold tracking-tight flex-1 text-center" style={{ color: gala.couleurSecondaire }}>
          {gala.titre}
        </h1>
        {gala.lieu && <p className="text-lg opacity-70">{gala.lieu}</p>}
      </div>

      {/* Thermomètre + chiffres */}
      <div className="px-16 py-6">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xl opacity-70 uppercase tracking-widest text-sm mb-1">{langue.collecte}</p>
            <p className="text-7xl font-black">{fmt(gala.totalCollecte)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl opacity-70 uppercase tracking-widest text-sm mb-1">{langue.objectif}</p>
            <p className="text-4xl font-bold opacity-80">{fmt(gala.objectif)}</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-10 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-4"
            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: gala.couleurSecondaire }}
          >
            {pct > 10 && <span className="text-sm font-bold" style={{ color: gala.couleurPrimaire }}>{pct}%</span>}
          </div>
        </div>
        <p className="text-center mt-2 opacity-60 text-sm">{gala.dons.length} {langue.dons}</p>
      </div>

      {/* Flash nouveau don */}
      {nouveauDon && (
        <div className="mx-16 mb-4 px-8 py-5 rounded-2xl animate-pulse"
          style={{ backgroundColor: gala.couleurSecondaire, color: gala.couleurPrimaire }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{fmt(nouveauDon.montant)}</p>
              <p className="text-lg font-semibold mt-1">
                {nouveauDon.anonyme ? langue.anonyme : (nouveauDon.nomAffiche || langue.anonyme)}
              </p>
              {nouveauDon.message && <p className="text-sm mt-1 opacity-70">"{nouveauDon.message}"</p>}
            </div>
            <p className="text-5xl">{langue.merci}</p>
          </div>
        </div>
      )}

      {/* Liste des dons récents */}
      <div className="flex-1 px-16 pb-8 overflow-hidden">
        <div className="grid grid-cols-3 gap-3">
          {gala.dons.slice(0, 12).map((don) => (
            <div key={don.id} className="px-5 py-3 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <p className="font-semibold truncate" style={{ color: gala.couleurSecondaire }}>
                {don.anonyme ? langue.anonyme : (don.nomAffiche || langue.anonyme)}
              </p>
              <p className="font-black ml-3 shrink-0" style={{ color: gala.couleurSecondaire }}>
                {fmt(don.montant)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
