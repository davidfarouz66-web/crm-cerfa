"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Mail, Phone, ChevronRight, ChevronLeft } from "lucide-react";

interface Donateur {
  id: string;
  type: string;
  nom: string;
  prenom?: string;
  raisonSociale?: string;
  email?: string;
  telephone?: string;
  ville?: string;
  _count: { cerfas: number };
}

export default function DonateursPage() {
  const [donateurs, setDonateurs] = useState<Donateur[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/donateurs?q=${encodeURIComponent(q)}&page=${page}`)
        .then((r) => r.json())
        .then((d) => {
          setDonateurs(d.data);
          setTotal(d.total);
          setTotalPages(d.totalPages);
          setLoading(false);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [q, page]);

  const getNom = (d: Donateur) =>
    d.type === "entreprise"
      ? d.raisonSociale || d.nom
      : `${d.prenom || ""} ${d.nom}`.trim();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Donateurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} donateur(s)</p>
        </div>
        <Link
          href="/donateurs/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          <span>Ajouter</span>
        </Link>
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un donateur..."
          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 w-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {donateurs.map((d) => (
              <Link
                key={d.id}
                href={`/donateurs/${d.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    d.type === "entreprise" ? "bg-violet-500" : "bg-blue-500"
                  }`}>
                    {getNom(d).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{getNom(d)}</p>
                    <div className="flex flex-col mt-0.5 gap-0.5">
                      {d.email && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate">{d.email}</span>
                        </span>
                      )}
                      {d.telephone && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone size={11} className="shrink-0" />{d.telephone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    {d._count.cerfas} CERFA
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </Link>
            ))}
            {donateurs.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <p className="mb-2">Aucun donateur trouvé</p>
                <Link href="/donateurs/nouveau" className="text-blue-600 text-sm hover:underline">
                  Ajouter le premier donateur →
                </Link>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
