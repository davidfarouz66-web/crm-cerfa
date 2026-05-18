"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FilePlus, FileText, MoreHorizontal, X, BarChart3, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donateurs", label: "Donateurs", icon: Users },
  { href: "/cerfa/nouveau", label: "Nouveau", icon: FilePlus },
  { href: "/cerfa", label: "CERFA", icon: FileText },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bottom-14 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute bottom-16 right-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-52">
            <Link href="/recapitulatif" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <BarChart3 size={17} className="text-slate-400" /> Bilan
            </Link>
            <Link href="/parametres" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">
              <Settings size={17} className="text-slate-400" /> Paramètres
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 w-full">
              <LogOut size={17} /> Déconnexion
            </button>
          </div>
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
        <button onClick={() => setOpen((v) => !v)}
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
