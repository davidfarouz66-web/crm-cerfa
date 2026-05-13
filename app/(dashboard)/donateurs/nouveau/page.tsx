import DonateurForm from "@/components/forms/DonateurForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NouveauDonateurPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/donateurs" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouveau donateur</h1>
          <p className="text-slate-500 text-sm mt-0.5">Remplissez les informations du donateur</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <DonateurForm mode="create" />
      </div>
    </div>
  );
}
