"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FilePlus, FileText,
  BarChart3, Settings, LogOut, Heart, Upload,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donateurs", label: "Donateurs", icon: Users },
  { href: "/cerfa/nouveau", label: "Nouveau CERFA", icon: FilePlus },
  { href: "/cerfa", label: "Liste CERFA", icon: FileText },
  { href: "/recapitulatif", label: "Récapitulatif", icon: BarChart3 },
  { href: "/import", label: "Import CSV", icon: Upload },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-64 bg-slate-800 text-slate-300 flex flex-col z-30">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">CRM CERFA</p>
            <p className="text-xs text-slate-400">Gestion des dons</p>
          </div>
        </div>
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

      <div className="p-4 border-t border-slate-700">
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
