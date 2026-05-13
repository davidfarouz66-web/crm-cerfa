import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(date));
}

export function generateNumeroCerfa(annee: number, sequence: number): string {
  return `A${annee}/${String(sequence).padStart(5, "0")}`;
}
