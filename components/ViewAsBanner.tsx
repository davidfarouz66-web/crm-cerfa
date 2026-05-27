"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Pencil, X } from "lucide-react";

export default function ViewAsBanner() {
  const [nom, setNom] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const matchNom = document.cookie.match(/(?:^|;\s*)view_as_nom=([^;]+)/);
    setNom(matchNom ? decodeURIComponent(matchNom[1]) : null);
  }, [pathname]);

  if (!nom) return null;

  async function quitter() {
    await fetch("/api/admin/view-as", { method: "DELETE" });
    setNom(null);
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Pencil size={15} />
        <span>Mode édition — <strong>{nom}</strong></span>
      </div>
      <button onClick={quitter}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-semibold">
        <X size={13} /> Quitter
      </button>
    </div>
  );
}
