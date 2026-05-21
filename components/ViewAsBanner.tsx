"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";

export default function ViewAsBanner() {
  const [nom, setNom] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Lit le cookie côté client (non httpOnly)
    const match = document.cookie.match(/(?:^|;\s*)view_as_nom=([^;]+)/);
    if (match) setNom(decodeURIComponent(match[1]));
  }, []);

  if (!nom) return null;

  async function quitter() {
    await fetch("/api/admin/view-as", { method: "DELETE" });
    setNom(null);
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Eye size={15} />
        <span>Mode consultation — <strong>{nom}</strong> — Lecture seule, aucune modification possible</span>
      </div>
      <button onClick={quitter}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-semibold">
        <X size={13} /> Quitter
      </button>
    </div>
  );
}
