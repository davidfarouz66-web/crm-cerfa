"use client";

import { useRef, useState } from "react";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  details: { numeroCerfa: string; donateur: string; montant: number }[];
}

const CSV_TEMPLATE = [
  "nom,prenom,email,type,adresse,code_postal,ville,montant,date_don,mode_paiement,numero_cerfa",
  "Dupont,Jean,jean.dupont@email.fr,particulier,12 rue de la Paix,75001,Paris,150,2025-03-15,virement,",
  "Martin,,contact@martin-sarl.fr,entreprise,5 avenue du Commerce,69001,Lyon,500,2025-05-20,cheque,",
].join("\n");

const COLONNES = [
  { name: "nom", required: true, desc: "Nom de famille ou raison sociale" },
  { name: "prenom", required: false, desc: "Prénom (particulier uniquement)" },
  { name: "email", required: false, desc: "Adresse email du donateur" },
  { name: "type", required: false, desc: "particulier ou entreprise (défaut : particulier)" },
  { name: "adresse", required: false, desc: "Adresse postale" },
  { name: "code_postal", required: false, desc: "Code postal" },
  { name: "ville", required: false, desc: "Ville" },
  { name: "montant", required: true, desc: "Montant du don en euros (ex: 150.50)" },
  { name: "date_don", required: true, desc: "Date du don au format AAAA-MM-JJ" },
  { name: "mode_paiement", required: true, desc: "virement, cheque, especes ou cb" },
  { name: "numero_cerfa", required: false, desc: "N° existant — laissez vide pour auto-générer" },
];

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/import/csv", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-cerfa.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Import CERFA</h1>
        <p className="text-slate-500 mt-1">Importez vos CERFA existants depuis un fichier CSV</p>
      </div>

      {/* Étape 1 — Télécharger le modèle */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center">1</span>
          <h2 className="font-semibold text-slate-700">Téléchargez le modèle</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Remplissez ce fichier avec vos données. Les colonnes marquées <span className="text-red-500 font-medium">*</span> sont obligatoires.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mb-4 overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pr-4 pb-2 font-medium">Colonne</th>
                <th className="text-left pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COLONNES.map((c) => (
                <tr key={c.name}>
                  <td className="pr-4 py-1.5 font-mono text-slate-700">
                    {c.name}{c.required && <span className="text-red-500 ml-0.5">*</span>}
                  </td>
                  <td className="py-1.5 text-slate-500">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
          <Download size={15} />
          Télécharger le modèle CSV
        </button>
      </div>

      {/* Étape 2 — Uploader le fichier */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center">2</span>
          <h2 className="font-semibold text-slate-700">Uploadez votre fichier rempli</h2>
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Glissez votre fichier CSV ici ou <span className="text-blue-600 font-medium">cliquez pour parcourir</span></p>
              <p className="text-xs text-slate-400 mt-1">Fichiers .csv uniquement</p>
            </>
          )}
        </div>
      </div>

      {/* Étape 3 — Importer */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center">3</span>
          <h2 className="font-semibold text-slate-700">Lancez l&apos;import</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Les donateurs inexistants seront créés automatiquement. Les CERFA avec un numéro déjà présent seront ignorés.
        </p>
        <button onClick={handleImport} disabled={!file || loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Import en cours…</>
          ) : (
            <><Upload size={15} /> Importer</>
          )}
        </button>
      </div>

      {/* Résultat */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Résultat de l&apos;import</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">CERFA créés</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Ignorés (doublons)</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{result.errors.length}</p>
              <p className="text-xs text-red-500 font-medium mt-0.5">Erreurs</p>
            </div>
          </div>

          {result.details.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">CERFA importés</p>
              <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{d.numeroCerfa}</span>
                      <span className="text-sm text-slate-400">— {d.donateur}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(d.montant)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Erreurs</p>
              <div className="bg-red-50 rounded-xl divide-y divide-red-100">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                    <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-600">Ligne {e.row} : {e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.created === 0 && result.errors.length === 0 && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              <span className="text-sm">Aucune donnée importée — tous les CERFA étaient déjà présents.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
