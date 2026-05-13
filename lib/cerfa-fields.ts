export interface FieldConfig {
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  maxWidth?: number;
  wb?: [number, number, number, number]; // x, y, w, h of white-box to erase
  label: string; // human-readable label for the admin UI
}

export interface SignatureConfig {
  x: number;
  y: number;
  maxW: number;
  maxH: number;
  label: string;
}

export interface CerfaMapping {
  numeroCerfa: FieldConfig;
  assocNom: FieldConfig;
  donateurNom: FieldConfig;
  donateurAdresse: FieldConfig;
  donateurVille: FieldConfig;
  benefNom: FieldConfig;
  benefSiren: FieldConfig;
  benefAdresse: FieldConfig;
  benefObjetLigne1: FieldConfig;
  benefObjetLigne2: FieldConfig;
  benefObjetLigne3: FieldConfig;
  qualite: FieldConfig;
  montantChiffre: FieldConfig;
  montantEuros: FieldConfig;
  montantLettres: FieldConfig;
  donNom: FieldConfig;
  donAdresse: FieldConfig;
  modePaiement: FieldConfig;
  dateEmission: FieldConfig;
  signature: SignatureConfig;
  logo: SignatureConfig;
}

export const DEFAULT_MAPPING: CerfaMapping = {
  numeroCerfa:     { x: 484, y: 793, size: 11, bold: true,  label: "N° d'ordre du reçu" },
  assocNom:        { x: 45,  y: 710, size: 9.5, bold: true,  label: "Nom association (haut gauche)" },

  // Mini-WB = couvre seulement les 2-3 premiers tirets avant le texte, pas toute la ligne
  donateurNom:     { x: 422, y: 700, size: 9.5, bold: true,  maxWidth: 123, wb: [408, 693, 15, 11], label: "Nom donateur (haut droite)" },
  donateurAdresse: { x: 370, y: 683, size: 9.5, bold: false, maxWidth: 175, wb: [358, 676, 13, 11], label: "Adresse donateur (haut droite)" },
  donateurVille:   { x: 424, y: 666, size: 9.5, bold: false, maxWidth: 121, wb: [413, 661, 12,  9], label: "Code postal / Ville donateur" },

  benefNom:        { x: 200, y: 621, size: 9.5, bold: false, maxWidth: 350, label: "Nom bénéficiaire" },
  benefSiren:      { x: 200, y: 601, size: 9.5, bold: false, maxWidth: 350, label: "SIREN / RNA bénéficiaire" },
  benefAdresse:    { x: 225, y: 581, size: 9.5, bold: false, maxWidth: 327, label: "Adresse association (bénéficiaire)" },
  benefObjetLigne1:{ x: 45,  y: 548, size: 9,   bold: false, label: "Objet social ligne 1" },
  benefObjetLigne2:{ x: 45,  y: 535, size: 9,   bold: false, label: "Objet social ligne 2" },
  benefObjetLigne3:{ x: 45,  y: 522, size: 9,   bold: false, label: "Objet social ligne 3" },
  qualite:         { x: 220, y: 510, size: 9.5, bold: false, maxWidth: 335, label: "Qualité de l'organisme" },

  // Montant : on efface toute la ligne puis on réécrit chiffre + Euros + lettres
  montantChiffre:  { x: 143, y: 459, size: 10,  bold: true,  wb: [138, 452, 350, 14], label: "Montant en chiffres" },
  montantEuros:    { x: 284, y: 459, size: 10,  bold: false, label: "Mot Euros (milieu)" },
  montantLettres:  { x: 320, y: 459, size: 9.5, bold: false, maxWidth: 165, label: "Montant en lettres" },

  donNom:          { x: 200, y: 397, size: 9.5, bold: false, maxWidth: 350, label: "Nom donateur (section DONATEUR)" },
  donAdresse:      { x: 210, y: 374, size: 9.5, bold: false, maxWidth: 340, wb: [188, 368, 25, 12], label: "Adresse donateur (section DONATEUR)" },

  modePaiement:    { x: 165, y: 142, size: 9.5, bold: true,  label: "Mode de versement" },
  dateEmission:    { x: 483, y: 125, size: 9.5, bold: true,  label: "Date d'émission" },

  signature:       { x: 413, y: 98, maxW: 140, maxH: 40,  label: "Signature / Cachet" },
  logo:            { x: 45,  y: 738, maxW: 100, maxH: 40, label: "Logo association" },
};
