import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen pb-28 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
