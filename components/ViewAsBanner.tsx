"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Eye, Pencil, X } from "lucide-react";

export default function ViewAsBanner() {
  const [nom, setNom] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const matchNom = document.cookie.match(/(?:^|;\s*)view_as_nom=([^;]+)/);
    setNom(matchNom ? decodeURIComponent(matchNom[1]) : null);
    const matchEdit = document.cookie.match(/(?:^|;\s*)view_as_edit=([^;]+)/);
    setEditMode(matchEdit?.[1] === "true");
  }, [pathname]); // relire les cookies à chaque changement de page

  if (!nom) return null;

  async function quitter() {
    await fetch("/api/admin/view-as", { method: "DELETE" });
    setNom(null);
    setEditMode(false);
    router.push("/admin");
    router.refresh();
  }

  async function toggleEdit() {
    const newMode = !editMode;
    await fetch("/api/admin/view-as", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edit: newMode }),
    });
    setEditMode(newMode);
    router.refresh();
  }

  return (
    <div className={`${editMode ? "bg-blue-600" : "bg-amber-500"} text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium sticky top-0 z-50`}>
      <div className="flex items-center gap-2">
        {editMode ? <Pencil size={15} /> : <Eye size={15} />}
        <span>
          {editMode ? "Mode édition" : "Mode consultation"} — <strong>{nom}</strong>
          {!editMode && " — Lecture seule"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleEdit}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-semibold">
          {editMode ? <><Eye size={13} /> Consultation</> : <><Pencil size={13} /> Édition</>}
        </button>
        <button onClick={quitter}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-semibold">
          <X size={13} /> Quitter
        </button>
      </div>
    </div>
  );
}
