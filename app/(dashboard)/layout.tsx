import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import KeepAlive from "@/components/KeepAlive";
import ViewAsBanner from "@/components/ViewAsBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-full flex-col">
      <ViewAsBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:ml-64 min-h-screen pb-28 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
      <KeepAlive />
    </div>
  );
}
