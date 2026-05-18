import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { existsSync, readFileSync } from "fs";
import path from "path";

async function loadImageBytes(src: string): Promise<{ bytes: Buffer; ext: string } | null> {
  try {
    if (src.startsWith("http")) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = src.split("?")[0].split(".").pop()?.toLowerCase() || "png";
      return { bytes: buf, ext };
    }
    const lp = path.join(process.cwd(), "public", src);
    if (!existsSync(lp)) return null;
    return { bytes: readFileSync(lp), ext: lp.split(".").pop()?.toLowerCase() || "png" };
  } catch { return null; }
}
import { montantEnLettres } from "./pdf";

const NAVY  = rgb(0.09, 0.19, 0.44);
const BLK   = rgb(0, 0, 0);
const WHT   = rgb(1, 1, 1);
const GREY  = rgb(0.45, 0.45, 0.45);
const LGREY = rgb(0.96, 0.97, 0.98);
const LBLUE = rgb(0.88, 0.92, 0.98);

function dateFr(date: Date): string {
  const m = ["janvier","février","mars","avril","mai","juin","juillet","août",
             "septembre","octobre","novembre","décembre"];
  const d = new Date(date);
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface MecenaData {
  numeroCerfa: string;
  donateur: {
    type: string;
    nom: string;
    raisonSociale?: string | null;
    formeJuridique?: string | null;
    siretDonateur?: string | null;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
  };
  dateDon: Date;
  montant: number;
  modePaiement: string;
  objetDon?: string | null;
  dateEmission: Date;
  association: {
    nom: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    siret?: string | null;
    rna?: string | null;
    objetSocial?: string | null;
    qualiteOrganisme?: string | null;
    representant?: string | null;
    logoUrl?: string | null;
    signatureUrl?: string | null;
  };
}

const MODES: Record<string, string> = {
  virement: "Virement bancaire",
  cheque:   "Chèque",
  especes:  "Espèces",
  cb:       "Paiement en ligne",
};

export async function generateMecenaPDF(data: MecenaData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const F    = await doc.embedFont(StandardFonts.Helvetica);
  const FB   = await doc.embedFont(StandardFonts.HelveticaBold);
  const FI   = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([595, 842]);
  const W    = 595;

  const txt = (text: string, x: number, y: number, sz: number, font = F, color = BLK) =>
    page.drawText(text, { x, y, size: sz, font, color });

  const box = (x: number, y: number, w: number, h: number, fill = LGREY, borderCol = rgb(0.75, 0.8, 0.9)) =>
    page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: borderCol, borderWidth: 0.5 });

  const bar = (y: number, label: string, h = 16) => {
    page.drawRectangle({ x: 0, y, width: W, height: h, color: NAVY, borderWidth: 0 });
    const lw = FB.widthOfTextAtSize(label, 8.5);
    txt(label, (W - lw) / 2, y + (h - 8.5) / 2 + 1, 8.5, FB, WHT);
  };

  // Ligne label navy + valeur noire
  const field = (label: string, value: string, x: number, y: number, labelW = 155) => {
    txt(label, x, y, 7.5, FB, NAVY);
    txt(value || "—", x + labelW, y, 8.5, F, BLK);
  };

  const checkbox = (x: number, y: number, checked: boolean) => {
    page.drawRectangle({ x, y, width: 9, height: 9, color: WHT, borderColor: GREY, borderWidth: 0.7 });
    if (checked) {
      page.drawLine({ start: { x: x + 1.5, y: y + 4.5 }, end: { x: x + 3.5, y: y + 2 },   thickness: 1.4, color: NAVY });
      page.drawLine({ start: { x: x + 3.5, y: y + 2   }, end: { x: x + 7.5, y: y + 7.5 }, thickness: 1.4, color: NAVY });
    }
  };

  const entName = (data.donateur.raisonSociale || data.donateur.nom).toUpperCase();
  const entAdr  = [data.donateur.adresse, data.donateur.codePostal, data.donateur.ville].filter(Boolean).join(", ");
  const rna     = data.association.rna || data.association.siret || "—";
  const assocAdr = [data.association.adresse, data.association.codePostal, data.association.ville].filter(Boolean).join(", ");
  const qualite  = data.association.qualiteOrganisme || "Oeuvre ou organisme d'interet general";
  const montantStr = data.montant.toFixed(2).replace(".", ",");

  // ── En-tête ────────────────────────────────────────────────────────────────
  // Boîte principale avec bordure navy
  page.drawRectangle({ x: 20, y: 762, width: W - 40, height: 72, color: WHT, borderColor: NAVY, borderWidth: 0.8 });

  // ── Encart CERFA gauche ────────────────────────────────────────────────────
  page.drawRectangle({ x: 20, y: 762, width: 100, height: 72, color: rgb(0.96, 0.97, 0.99), borderWidth: 0 });
  page.drawLine({ start: { x: 120, y: 762 }, end: { x: 120, y: 834 }, thickness: 0.5, color: rgb(0.75, 0.8, 0.9) });

  txt("2041-MEC-SD", 26, 820, 7.5, FB, NAVY);
  // Ovale "cerfa" — ellipse via Bézier en coordonnées SVG (y vers le bas)
  // x/y dans drawSvgPath = coin supérieur gauche en coordonnées PDF (y vers le haut)
  const cerfaW = FI.widthOfTextAtSize("cerfa", 9);
  const ow = 52, oh = 15, ox = 26, oy_top = 814; // top en coords PDF
  const k = 0.552, orx = ow / 2, ory = oh / 2;
  // Path en coords SVG : origine = coin haut-gauche de l'ovale, y vers le bas
  const ovalPath =
    `M ${orx} 0 ` +
    `C ${orx + k * orx} 0, ${ow} ${ory - k * ory}, ${ow} ${ory} ` +
    `C ${ow} ${ory + k * ory}, ${orx + k * orx} ${oh}, ${orx} ${oh} ` +
    `C ${orx - k * orx} ${oh}, 0 ${ory + k * ory}, 0 ${ory} ` +
    `C 0 ${ory - k * ory}, ${orx - k * orx} 0, ${orx} 0 Z`;
  page.drawSvgPath(ovalPath, { x: ox, y: oy_top, borderColor: NAVY, borderWidth: 1, color: WHT });
  txt("cerfa", ox + (ow - cerfaW) / 2, 803, 9, FI, NAVY);
  txt("N° 16216*03",         26, 792, 6, F, GREY);
  txt("Art. 238 bis C.G.I.", 26, 782, 6, F, GREY);
  txt("(Entreprises)",       26, 772, 6, F, GREY);

  // ── Logo association (après l'encart cerfa) ────────────────────────────────
  let logoEndX = 118;
  const logoSrc = data.association.logoUrl?.split("?")[0];
  if (logoSrc) {
    try {
      const img = await loadImageBytes(logoSrc);
      if (img) {
        const li  = (img.ext === "jpg" || img.ext === "jpeg") ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
        const sc  = Math.min(50 / li.width, 34 / li.height);
        const lw  = li.width * sc, lh = li.height * sc;
        page.drawImage(li, { x: 116, y: 779 - lh / 2, width: lw, height: lh });
        logoEndX = 116 + lw + 6;
      }
    } catch { }
  }

  // ── Boîte N° d'ordre (droite) ─────────────────────────────────────────────
  page.drawRectangle({ x: 450, y: 762, width: 125, height: 72, color: LGREY, borderColor: NAVY, borderWidth: 0.8 });
  txt("N° d'ordre du recu", 458, 820, 7, F, GREY);
  txt(data.numeroCerfa,     458, 803, 11, FB, NAVY);

  // ── Titre centré entre encart CERFA et boîte droite ──────────────────────
  const titleMid = 120 + (450 - 120) / 2;
  const t1 = "Recu des dons et versements effectues par les entreprises";
  const t2 = "au titre de l'article 238 bis du code general des impots";
  txt(t1, titleMid - FB.widthOfTextAtSize(t1, 8.5) / 2, 807, 8.5, FB, NAVY);
  txt(t2, titleMid - F.widthOfTextAtSize(t2, 7.5) / 2,  794, 7.5, F,  GREY);

  // ── Ligne : asso gauche | entreprise droite — même y ──────────────────────
  txt(data.association.nom.toUpperCase(), 28, 749, 9.5, FB, NAVY);

  // Bloc entreprise : aligné sur le bord gauche de la boîte N° d'ordre (x=450)
  const ENT_X     = 450;
  const ENT_LBL_W = 78;  // largeur labels dans l'espace restant (450→567)
  txt(entName, ENT_X, 749, 9.5, FB, BLK);

  const detailsRight: Array<{ label: string; value: string }> = [];
  if (data.donateur.formeJuridique) detailsRight.push({ label: "Forme juridique :", value: data.donateur.formeJuridique });
  if (data.donateur.siretDonateur)  detailsRight.push({ label: "SIREN :",           value: data.donateur.siretDonateur });

  detailsRight.forEach(({ label, value }, i) => {
    const lineY = 737 - i * 12;
    txt(label, ENT_X,              lineY, 7,   FB, NAVY);
    txt(value, ENT_X + ENT_LBL_W, lineY, 7.5, F,  BLK);
  });

  let y = 719;

  // ── ORGANISME BÉNÉFICIAIRE ─────────────────────────────────────────────────
  bar(y - 16, "ORGANISME BENEFICIAIRE DES DONS ET VERSEMENTS");
  y -= 22;

  const orgH = data.association.objetSocial ? 90 : 76;
  box(28, y - orgH, W - 56, orgH + 2);

  field("NOM OU DENOMINATION :",     data.association.nom, 36, y - 12);
  field("NUMERO SIREN OU RNA :",     rna,                  36, y - 27);
  field("ADRESSE DE L'ASSOCIATION :", assocAdr,            36, y - 42);

  if (data.association.objetSocial) {
    const lines = wrapText(data.association.objetSocial, F, 8.5, 330);
    txt("OBJET :", 36, y - 57, 7.5, FB, NAVY);
    lines.slice(0, 1).forEach(line => txt(line, 36 + 155, y - 57, 8.5, F, BLK));
    field("QUALITE DE L'ORGANISME :", qualite, 36, y - 72);
  } else {
    field("QUALITE DE L'ORGANISME :", qualite, 36, y - 57);
  }

  y -= orgH + 10;

  // ── Mention + montant ──────────────────────────────────────────────────────
  const legal1 = "Le beneficiaire reconnait avoir recu, au titre des dons et versements ouvrant droit a reduction d'impot, la somme de :";
  txt(legal1, 28, y, 7.5, F, GREY);
  y -= 12;

  // Boîte montant avec bordure navy
  page.drawRectangle({ x: 28, y: y - 26, width: W - 56, height: 30, color: WHT, borderColor: NAVY, borderWidth: 0.8 });

  const lettresStr = montantEnLettres(data.montant);
  const stars = "***";
  const starsW   = F.widthOfTextAtSize(stars, 8.5);
  const chiffreW = FB.widthOfTextAtSize(montantStr, 11);
  const eurosW   = FB.widthOfTextAtSize(" Euros", 11);
  const lettresW = FB.widthOfTextAtSize(lettresStr, 9);
  const totalW   = starsW + 4 + chiffreW + eurosW + 4 + starsW + 12 + lettresW;
  let cx = 28 + (W - 56 - totalW) / 2;
  txt(stars,       cx, y - 17, 8.5, F,  GREY); cx += starsW + 4;
  txt(montantStr,  cx, y - 17, 11,  FB, BLK);  cx += chiffreW;
  txt(" Euros",    cx, y - 17, 11,  FB, BLK);  cx += eurosW + 4;
  txt(stars,       cx, y - 17, 8.5, F,  GREY); cx += starsW + 12;
  txt(lettresStr,  cx, y - 17, 9,   FB, BLK);

  y -= 38;

  // ── ENTREPRISE DONATRICE ───────────────────────────────────────────────────
  bar(y - 16, "ENTREPRISE DONATRICE");
  y -= 22;

  const entRows: Array<{ label: string; value: string }> = [
    { label: "NOM OU DENOMINATION :", value: entName },
    { label: "FORME JURIDIQUE :",      value: data.donateur.formeJuridique || "—" },
    { label: "N° SIREN :",             value: data.donateur.siretDonateur  || "—" },
    { label: "ADRESSE :",              value: entAdr || "—" },
    ...(data.objetDon ? [{ label: "OBJET DU DON :", value: data.objetDon }] : []),
  ];
  const entBoxH = 14 + entRows.length * 16;
  box(28, y - entBoxH, W - 56, entBoxH + 2);

  // Toutes les valeurs partent du même x (labelW fixe = 155)
  entRows.forEach(({ label, value }, i) => {
    field(label, value, 36, y - 12 - i * 16);
  });

  y -= entBoxH + 10;

  // ── Boîte légale bleue ─────────────────────────────────────────────────────
  page.drawRectangle({ x: 28, y: y - 36, width: W - 56, height: 38, color: LBLUE, borderColor: rgb(0.5, 0.6, 0.8), borderWidth: 0.4 });
  const l1 = "Le beneficiaire certifie sur l'honneur que les dons et versements qu'il recoit";
  const l2 = "ouvrent droit a la reduction d'impot prevue a l'article 238 bis du C.G.I.";
  txt(l1, (W - FB.widthOfTextAtSize(l1, 8)) / 2, y - 14, 8, FB, NAVY);
  txt(l2, (W - F.widthOfTextAtSize(l2, 8))  / 2, y - 26, 8, F,  NAVY);

  y -= 46;

  // ── Forme des versements ───────────────────────────────────────────────────
  txt("Forme des versements :", 28, y, 7.5, FB, NAVY);
  y -= 16;

  const formes = [
    { keys: ["especes", "cheque", "virement", "cb"], label: "Numeraire" },
    { keys: ["nature"],      label: "En nature" },
    { keys: ["competence"],  label: "Mise a disposition de competences" },
  ];
  let bx = 28;
  for (const opt of formes) {
    checkbox(bx, y - 8, opt.keys.includes(data.modePaiement));
    txt(opt.label, bx + 13, y - 6, 8, F, BLK);
    bx += 175;
  }
  y -= 26;
  page.drawLine({ start: { x: 28, y }, end: { x: W - 28, y }, thickness: 0.4, color: rgb(0.75, 0.8, 0.9) });
  y -= 16;

  // ── Date + Mode ────────────────────────────────────────────────────────────
  txt("Date du versement :",  28,  y, 7.5, FB, NAVY);
  txt(dateFr(data.dateDon),   28 + 125, y, 8.5, FB, BLK);
  txt("Mode de versement :", 310,  y, 7.5, FB, NAVY);
  txt(MODES[data.modePaiement] || data.modePaiement, 310 + 120, y, 8.5, FB, BLK);

  y -= 18;

  // ── Zone signature ─────────────────────────────────────────────────────────
  const sigH = 88;
  // Récapitulatif gauche
  box(28, y - sigH, 250, sigH);
  txt("Recapitulatif du recu", 36, y - 12, 8, FB, NAVY);
  const fS = (lbl: string, val: string, fy: number) => {
    txt(lbl, 36, fy, 7.5, FB, NAVY);
    txt(val, 36 + 72, fy, 8, F, BLK);
  };
  fS("N° de recu :",   data.numeroCerfa,        y - 27);
  fS("Donateur :",     entName,                  y - 42);
  fS("Montant :",      montantStr + " Euros",    y - 57);
  fS("Date du don :", dateFr(data.dateDon),      y - 72);

  // Signature droite
  page.drawRectangle({ x: 286, y: y - sigH, width: W - 28 - 286, height: sigH, color: WHT, borderColor: NAVY, borderWidth: 0.8 });
  txt("Date et signature :", 294, y - 12, 7.5, FB, NAVY);
  txt("Fait le " + dateFr(data.dateEmission), 294, y - 25, 8, F, BLK);

  const sigSrc = data.association.signatureUrl?.split("?")[0];
  if (sigSrc) {
    try {
      const img = await loadImageBytes(sigSrc);
      if (img) {
        const si  = (img.ext === "jpg" || img.ext === "jpeg") ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
        const sc  = Math.min(120 / si.width, 44 / si.height);
        const sw  = si.width * sc, sh = si.height * sc;
        const sigBoxW = W - 28 - 286;
        page.drawImage(si, { x: 286 + (sigBoxW - sw) / 2, y: y - sigH + (sigH - sh) / 2 - 4, width: sw, height: sh });
      }
    } catch { }
  }

  if (data.association.representant) {
    const repSz   = 7;
    const sigBoxW = W - 28 - 286;
    const repW    = F.widthOfTextAtSize(data.association.representant, repSz);
    txt(data.association.representant, 286 + (sigBoxW - repW) / 2, y - sigH + 9, repSz, F, GREY);
  }

  // ── Pied de page ───────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 28, y: 52 }, end: { x: W - 28, y: 52 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  const foot = `Document etabli conformement a l'article 238 bis du CGI — ${data.association.nom}`;
  txt(foot, (W - F.widthOfTextAtSize(foot, 7)) / 2, 40, 7, F, rgb(0.5, 0.5, 0.5));

  return doc.save();
}
