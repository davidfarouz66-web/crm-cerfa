"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FilePlus, FileText, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donateurs", label: "Donateurs", icon: Users },
  { href: "/cerfa/nouveau", label: "Nouveau", icon: FilePlus },
  { href: "/cerfa", label: "CERFA", icon: FileText },
  { href: "/recapitulatif", label: "Bilan", icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-30 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              active ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <Icon size={20} className={item.href === "/cerfa/nouveau" ? "mb-0.5" : "mb-0.5"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
