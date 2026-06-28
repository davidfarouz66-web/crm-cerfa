"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FilePlus, FileText,
  BarChart3, Settings, LogOut, Heart, Upload, Shield, Building2, Tv,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donateurs", label: "Donateurs", icon: Users },
  { href: "/cerfa/nouveau", label: "Nouveau CERFA", icon: FilePlus },
  { href: "/cerfa", label: "Liste CERFA", icon: FileText },
  { href: "/recapitulatif", label: "Récapitulatif", icon: BarChart3 },
  { href: "/import", label: "Import CSV", icon: Upload },
  { href: "/gala", label: "Galas", icon: Tv },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [assocNom, setAssocNom] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/association")
      .then((r) => r.json())
      .then((d) => { if (d?.nom) setAssocNom(d.nom); })
      .catch(() => {});
  }, [pathname]); // recharge quand la page change (utile en mode view-as)

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-64 bg-slate-800 text-slate-300 flex flex-col z-30">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Trouma-Pro</p>
            <p className="text-xs text-slate-400">Gestion des dons</p>
          </div>
        </div>
        {assocNom && (
          <div className="flex items-center gap-2 bg-slate-700/60 rounded-lg px-3 py-2">
            <Building2 size={13} className="text-blue-400 shrink-0" />
            <p className="text-xs text-slate-200 font-medium truncate">{assocNom}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-1">
        {role === "superadmin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith("/admin")
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Shield size={18} />
            Administration
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
