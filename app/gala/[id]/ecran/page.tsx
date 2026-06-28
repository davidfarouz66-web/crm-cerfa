"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

const LABELS: Record<string, Record<string, string>> = {
  fr: { objectif: "Objectif", collecte: "Collecté", dons: "dons", anonyme: "Donateur anonyme", merci: "Merci !" },
  en: { objectif: "Goal", collecte: "Raised", dons: "donations", anonyme: "Anonymous donor", merci: "Thank you!" },
  he: { objectif: "יעד", collecte: "נאסף", dons: "תרומות", anonyme: "תורם אנונימי", merci: "תודה רבה!" },
  ar: { objectif: "الهدف", collecte: "تم جمع", dons: "تبرعات", anonyme: "متبرع مجهول", merci: "شكراً جزيلاً!" },
};

const MILESTONES = [25, 50, 75, 100];

interface Don { id: string; montant: number; nomAffiche: string | null; anonyme: boolean; message: string | null; createdAt: string; }
interface Gala { id: string; titre: string; objectif: number; totalCollecte: number; couleurPrimaire: string; couleurSecondaire: string; langue: string; logoUrl: string | null; lieu: string | null; dons: Don[]; }

interface Confetti { id: number; x: number; color: string; size: number; speed: number; angle: number; spin: number; }

function playMilestoneSound(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.4);
  });
}

function playDonSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.1);
  osc.type = "sine";
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

const CONFETTI_COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

export default function EcranGala() {
  const { id } = useParams<{ id: string }>();
  const [gala, setGala] = useState<Gala | null>(null);
  const [nouveauDon, setNouveauDon] = useState<Don | null>(null);
  const [confettis, setConfettis] = useState<Confetti[]>([]);
  const [milestoneLabel, setMilestoneLabel] = useState<string | null>(null);
  const reachedMilestones = useRef<Set<number>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevDonsLen = useRef(0);
  const confettiId = useRef(0);

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }

  function launchConfetti(count = 80) {
    const newConfettis: Confetti[] = Array.from({ length: count }, () => ({
      id: confettiId.current++,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 10,
      speed: 2 + Math.random() * 4,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
    }));
    setConfettis(prev => [...prev, ...newConfettis]);
    setTimeout(() => setConfettis(prev => prev.filter(c => !newConfettis.find(n => n.id === c.id))), 4000);
  }

  const fetchGala = useCallback(async () => {
    const res = await fetch(`/api/gala/${id}`);
    if (!res.ok) return;
    const data: Gala = await res.json();
    const pct = Math.min(100, Math.round((data.totalCollecte / data.objectif) * 100));

    setGala(prev => {
      if (prev && data.dons.length > prevDonsLen.current) {
        const nouveau = data.dons[0];
        setNouveauDon(nouveau);
        setTimeout(() => setNouveauDon(null), 5000);
        try { playDonSound(getAudioCtx()); } catch {}
      }
      prevDonsLen.current = data.dons.length;

      MILESTONES.forEach(m => {
        if (pct >= m && !reachedMilestones.current.has(m)) {
          reachedMilestones.current.add(m);
          launchConfetti(m === 100 ? 200 : 100);
          setMilestoneLabel(`${m}% atteint !`);
          setTimeout(() => setMilestoneLabel(null), 4000);
          try { playMilestoneSound(getAudioCtx()); } catch {}
        }
      });

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
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const langue = LABELS[gala.langue] || LABELS.fr;
  const pct = Math.min(100, Math.round((gala.totalCollecte / gala.objectif) * 100));
  const isRTL = gala.langue === "he" || gala.langue === "ar";
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ backgroundColor: gala.couleurPrimaire, color: gala.couleurSecondaire, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Confettis */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {confettis.map(c => (
          <div
            key={c.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${c.x}%`,
              width: c.size,
              height: c.size * 0.6,
              backgroundColor: c.color,
              animation: `fall ${c.speed}s ease-in forwards`,
              transform: `rotate(${c.angle}deg)`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes flashIn {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 50px rgba(255,255,255,0.7); }
        }
        .flash-in { animation: flashIn 0.4s ease-out forwards; }
        .pulse-glow { animation: pulse-glow 1.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8 pb-2">
        {gala.logoUrl
          ? <img src={gala.logoUrl} alt="Logo" className="h-16 object-contain" />
          : <div />}
        <div className="text-center flex-1">
          <h1 className="text-5xl font-black tracking-tight" style={{ color: gala.couleurSecondaire }}>
            {gala.titre}
          </h1>
          {gala.lieu && <p className="text-lg opacity-60 mt-1">{gala.lieu}</p>}
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-3xl font-black opacity-90">{pct}%</p>
          <p className="text-sm opacity-50">{langue.dons.replace("dons", "")} {gala.dons.length} {langue.dons}</p>
        </div>
      </div>

      {/* Chiffres principaux */}
      <div className="flex items-end justify-between px-16 py-4">
        <div>
          <p className="text-sm uppercase tracking-widest opacity-60 mb-1">{langue.collecte}</p>
          <p className="text-8xl font-black leading-none">{fmt(gala.totalCollecte)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-widest opacity-60 mb-1">{langue.objectif}</p>
          <p className="text-4xl font-bold opacity-70">{fmt(gala.objectif)}</p>
        </div>
      </div>

      {/* Barre de progression avec paliers */}
      <div className="px-16 mb-4">
        <div className="relative w-full h-14 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          {/* Remplissage */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-5"
            style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: gala.couleurSecondaire }}
          >
            {pct > 8 && (
              <span className="text-xl font-black" style={{ color: gala.couleurPrimaire }}>{pct}%</span>
            )}
          </div>

          {/* Marqueurs paliers */}
          {MILESTONES.slice(0, -1).map(m => (
            <div
              key={m}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${m}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-0.5 h-full opacity-40" style={{ backgroundColor: gala.couleurPrimaire }} />
            </div>
          ))}
        </div>

        {/* Labels paliers sous la barre */}
        <div className="relative w-full mt-2">
          {MILESTONES.map(m => {
            const reached = pct >= m;
            return (
              <div
                key={m}
                className="absolute flex flex-col items-center"
                style={{ left: `${m}%`, transform: "translateX(-50%)" }}
              >
                <span
                  className="text-sm font-bold transition-all duration-500"
                  style={{ color: gala.couleurSecondaire, opacity: reached ? 1 : 0.3 }}
                >
                  {m}%
                </span>
                <span style={{ color: gala.couleurSecondaire, opacity: reached ? 0.8 : 0.2, fontSize: 10 }}>
                  {fmt(gala.objectif * m / 100)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flash palier atteint */}
      {milestoneLabel && (
        <div className="mx-16 mb-3 flash-in">
          <div className="pulse-glow rounded-2xl px-8 py-4 text-center"
            style={{ backgroundColor: gala.couleurSecondaire, color: gala.couleurPrimaire }}>
            <p className="text-4xl font-black">🎉 {milestoneLabel}</p>
          </div>
        </div>
      )}

      {/* Flash nouveau don */}
      {nouveauDon && !milestoneLabel && (
        <div className="mx-16 mb-3 flash-in">
          <div className="rounded-2xl px-8 py-4 flex items-center justify-between"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: `2px solid ${gala.couleurSecondaire}` }}>
            <div>
              <p className="text-3xl font-black" style={{ color: gala.couleurSecondaire }}>{fmt(nouveauDon.montant)}</p>
              <p className="text-xl font-semibold mt-1 opacity-80">
                {nouveauDon.anonyme ? langue.anonyme : (nouveauDon.nomAffiche || langue.anonyme)}
              </p>
              {nouveauDon.message && <p className="text-base mt-1 opacity-60">"{nouveauDon.message}"</p>}
            </div>
            <p className="text-5xl ml-8">{langue.merci}</p>
          </div>
        </div>
      )}

      {/* Liste dons récents */}
      <div className="flex-1 px-16 pb-6 overflow-hidden mt-2">
        <div className="grid grid-cols-4 gap-3">
          {gala.dons.slice(0, 8).map((don) => (
            <div key={don.id} className="px-5 py-3 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <p className="font-semibold truncate text-sm" style={{ color: gala.couleurSecondaire }}>
                {don.anonyme ? langue.anonyme : (don.nomAffiche || langue.anonyme)}
              </p>
              <p className="font-black ml-3 shrink-0 text-sm" style={{ color: gala.couleurSecondaire }}>
                {fmt(don.montant)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
