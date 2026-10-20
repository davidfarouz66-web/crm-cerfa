"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FilePlus, FileText, MoreHorizontal, X, BarChart3, Settings, LogOut, Shield, Tv } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donateurs", label: "Donateurs", icon: Users },
  { href: "/cerfa/nouveau", label: "Nouveau", icon: FilePlus },
  { href: "/cerfa", label: "CERFA", icon: FileText },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div role="menu" aria-label="Menu supplémentaire" className="fixed bottom-[calc(4rem_+_env(safe-area-inset-bottom))] right-3 z-[60] max-h-[calc(100dvh_-_6rem_-_env(safe-area-inset-bottom))] w-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl md:hidden">
          <Link href="/recapitulatif" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <BarChart3 size={17} className="text-slate-400" /> Bilan
          </Link>
          <Link href="/campagnes" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">
            <Tv size={17} className="text-slate-400" /> Campagnes
          </Link>
          <Link href="/parametres" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">
            <Settings size={17} className="text-slate-400" /> Paramètres
          </Link>
          {role === "superadmin" && (
            <button type="button" onClick={() => { setOpen(false); router.push("/admin"); }}
              className="flex min-h-12 w-full touch-manipulation items-center gap-3 border-t border-slate-50 px-4 py-3.5 text-left text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 active:bg-blue-100">
              <Shield size={17} className="text-blue-500" /> Administration
            </button>
          )}
          <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 w-full">
            <LogOut size={17} /> Déconnexion
          </button>
        </div>
      )}

      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
                active ? "text-blue-600" : "text-slate-500"
              }`}>
              <Icon size={20} className="mb-0.5" />
              {item.label}
            </Link>
          );
        })}
        <button type="button" aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu Plus"} onClick={() => setOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
            open ? "text-blue-600" : "text-slate-500"
          }`}>
          {open ? <X size={20} className="mb-0.5" /> : <MoreHorizontal size={20} className="mb-0.5" />}
          {open ? "Fermer" : "Plus"}
        </button>
      </nav>
    </>
  );
}
