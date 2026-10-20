"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, FileCheck2, Heart, Loader2, ShieldCheck } from "lucide-react";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [rescrit, setRescrit] = useState("non_demande");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    form.delete("confirm");
    form.set("attestationExactitude", form.get("attestationExactitude") ? "true" : "false");
    form.set("attestationResponsabilite", form.get("attestationResponsabilite") ? "true" : "false");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Le dossier n’a pas pu être transmis.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Le dossier n’a pas pu être transmis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600 shadow-lg">
            <Heart size={26} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold">Trouma Pro</h1>
          <p className="mt-2 text-slate-300">Demande d’ouverture d’un espace CERFA</p>
        </header>

        <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
          {done ? (
            <div className="px-6 py-14 text-center md:px-12">
              <CheckCircle size={52} className="mx-auto mb-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-slate-900">Dossier transmis</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Votre demande et vos justificatifs vont être examinés manuellement. Votre compte restera en attente et aucun reçu fiscal ne pourra être émis avant validation.
              </p>
              <Link href="/login" className="mt-7 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
                Revenir à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
              <div className="bg-blue-50 px-5 py-4 md:px-8">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={20} aria-hidden="true" />
                  <p className="text-sm leading-6 text-blue-950">
                    Le dépôt de ce dossier ne constitue pas une reconnaissance de votre éligibilité au mécénat. Trouma Pro contrôle les pièces avant d’activer l’émission de reçus fiscaux. L’organisme reste responsable de la conformité des reçus qu’il émet.
                  </p>
                </div>
              </div>

              <section className="px-5 py-7 md:px-8">
                <h2 className="text-lg font-bold text-slate-900">1. Identification de l’organisme</h2>
                <p className="mt-1 text-sm text-slate-500">Les informations doivent correspondre aux justificatifs déposés.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Nom officiel de l’association" name="nomAssociation" required />
                  <SelectField label="Type d’organisme" name="typeOrganisme" required>
                    <option value="">Sélectionner</option>
                    <option>Association loi 1901</option>
                    <option>Association cultuelle</option>
                    <option>Fondation</option>
                    <option>Fonds de dotation</option>
                    <option>Autre organisme sans but lucratif</option>
                  </SelectField>
                  <Field label="Numéro RNA" name="rna" placeholder="W123456789" pattern="W[0-9]{9}" />
                  <Field label="Numéro SIRET" name="siret" placeholder="14 chiffres" inputMode="numeric" pattern="[0-9 ]{14,17}" />
                  <Field label="Téléphone" name="telephone" type="tel" required />
                  <Field label="Adresse email" name="email" type="email" autoComplete="email" required />
                  <div className="md:col-span-2"><Field label="Adresse du siège" name="adresse" autoComplete="street-address" required /></div>
                  <Field label="Code postal" name="codePostal" autoComplete="postal-code" required />
                  <Field label="Ville" name="ville" autoComplete="address-level2" required />
                  <div className="md:col-span-2">
                    <label htmlFor="objetSocial" className={labelClass}>Objet social inscrit dans les statuts *</label>
                    <textarea id="objetSocial" name="objetSocial" required minLength={80} rows={4} className={inputClass} />
                    <p className="mt-1 text-xs text-slate-500">Minimum 80 caractères. Décrivez fidèlement l’objet prévu par vos statuts.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="publicBeneficiaire" className={labelClass}>Public bénéficiaire et activités exercées *</label>
                    <textarea id="publicBeneficiaire" name="publicBeneficiaire" required rows={4} className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="px-5 py-7 md:px-8">
                <h2 className="text-lg font-bold text-slate-900">2. Représentant légal et accès</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Nom et prénom du représentant légal" name="responsableLegalNom" required />
                  <Field label="Fonction" name="responsableLegalFonction" placeholder="Président, trésorier…" required />
                  <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" minLength={8} required />
                  <Field label="Confirmer le mot de passe" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
                </div>
              </section>

              <section className="px-5 py-7 md:px-8">
                <h2 className="text-lg font-bold text-slate-900">3. Situation fiscale et justificatifs</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Les documents sont conservés dans un espace privé et consultables uniquement par l’administration Trouma Pro.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <SelectField label="Situation du rescrit mécénat" name="rescritFiscalStatut" value={rescrit} onChange={e => setRescrit(e.target.value)} required>
                    <option value="non_demande">Aucun rescrit demandé</option>
                    <option value="en_cours">Demande de rescrit en cours</option>
                    <option value="favorable">Réponse favorable obtenue</option>
                  </SelectField>
                  <div className="hidden md:block" />
                  <FileField label="Statuts datés et signés" name="documentStatuts" required />
                  <FileField label="Justificatif RNA ou avis SIRENE" name="documentImmatriculation" required />
                  <FileField label={rescrit === "favorable" ? "Réponse favorable au rescrit" : "Autre preuve d’éligibilité (facultatif)"} name="documentEligibilite" required={rescrit === "favorable"} />
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  <FileCheck2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Formats acceptés : PDF, JPG ou PNG. Taille totale maximale : 4 Mo.
                </div>
              </section>

              <section className="px-5 py-7 md:px-8">
                <h2 className="text-lg font-bold text-slate-900">4. Attestations</h2>
                <div className="mt-5 space-y-4">
                  <CheckField name="attestationExactitude">Je certifie sur l’honneur que les informations et documents transmis sont exacts, complets et à jour.</CheckField>
                  <CheckField name="attestationResponsabilite">Je reconnais que l’organisme demeure seul responsable de son éligibilité fiscale et de la conformité des reçus émis. Je m’engage à signaler toute modification de situation.</CheckField>
                </div>
                {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                  {loading ? "Transmission du dossier…" : "Transmettre mon dossier"}
                </button>
                <p className="mt-4 text-center text-sm text-slate-500">Déjà inscrit ? <Link href="/login" className="font-medium text-blue-700 hover:underline">Se connecter</Link></p>
              </section>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };
function Field({ label, name, ...props }: FieldProps) {
  return <div><label htmlFor={name} className={labelClass}>{label}{props.required ? " *" : ""}</label><input id={name} name={name} className={inputClass} {...props} /></div>;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: React.ReactNode };
function SelectField({ label, name, children, ...props }: SelectProps) {
  return <div><label htmlFor={name} className={labelClass}>{label}{props.required ? " *" : ""}</label><select id={name} name={name} className={inputClass} {...props}>{children}</select></div>;
}

function FileField({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return <div><label htmlFor={name} className={labelClass}>{label}{required ? " *" : ""}</label><input id={name} name={name} type="file" accept="application/pdf,image/jpeg,image/png" required={required} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-700" /></div>;
}

function CheckField({ name, children }: { name: string; children: React.ReactNode }) {
  return <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" name={name} required className="mt-1 h-4 w-4 shrink-0 accent-blue-600" /><span>{children}</span></label>;
}
