import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { montantEnLettres, clean } from "./pdf";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function loadImageBytes(src: string): Promise<{ bytes: Buffer; ext: string } | null> {
  try {
    if (!src.startsWith("http")) return null;
    const res = await fetch(src);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = src.split("?")[0].split(".").pop()?.toLowerCase() || "png";
    return { bytes: buf, ext };
  } catch { return null; }
}

function dateFr(date: Date): string {
  const m = ["janvier","février","mars","avril","mai","juin","juillet","août",
             "septembre","octobre","novembre","décembre"];
  const d = new Date(date);
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) { current = test; }
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COULEURS
// ─────────────────────────────────────────────────────────────────────────────
const NAVY   = rgb(0.09, 0.19, 0.44);
const BLK    = rgb(0,    0,    0   );
const WHT    = rgb(1,    1,    1   );
const GREY   = rgb(0.45, 0.45, 0.45);
const LGREY  = rgb(0.96, 0.97, 1.00);
const BORDER = rgb(0.70, 0.75, 0.88);
const CERTBG = rgb(0.97, 0.98, 1.00);

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────
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
  articleFiscal?: string | null;
  formeDon?: string | null;
  natureDon?: string | null;
  association: {
    nom: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    pays?: string | null;
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

// ─────────────────────────────────────────────────────────────────────────────
//  GÉNÉRATEUR — CERFA 2041-MEC-SD (Entreprises)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMecenaPDF(data: MecenaData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const F    = await doc.embedFont(StandardFonts.Helvetica);
  const FB   = await doc.embedFont(StandardFonts.HelveticaBold);
  const FI   = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([595, 842]);
  const W    = 595;
  const MX   = 28;

  const txt = (text: string, x: number, y: number, sz: number, font = F, color = BLK) =>
    page.drawText(String(text).replace(/[\r\n\t]/g, " ").trim(), { x, y, size: sz, font, color });

  const box = (x: number, y: number, w: number, h: number, fill = LGREY) =>
    page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: BORDER, borderWidth: 0.6 });

  const bar = (y: number, label: string, h = 20) => {
    page.drawRectangle({ x: MX, y, width: W-MX*2, height: h, color: NAVY, borderWidth: 0 });
    const lw = FB.widthOfTextAtSize(label, 9);
    txt(label, (W - lw) / 2, y + (h - 9) / 2 + 1, 9, FB, WHT);
  };

  const field = (label: string, value: string, x: number, y: number, labelW = 160) => {
    txt(label, x, y, 7.5, FB, NAVY);
    if (value) txt(value, x + labelW, y, 8.5, F, BLK);
  };

  const cb = (x: number, y: number, checked: boolean, label: string, sz = 8) => {
    const bs = 9;
    page.drawRectangle({ x, y: y - 1, width: bs, height: bs, color: WHT, borderColor: GREY, borderWidth: 0.7 });
    if (checked) {
      page.drawLine({ start: { x: x+1.5, y: y+3.5 }, end: { x: x+3.5, y: y+1.5 }, thickness: 1.4, color: NAVY });
      page.drawLine({ start: { x: x+3.5, y: y+1.5 }, end: { x: x+7.5, y: y+7.5 }, thickness: 1.4, color: NAVY });
    }
    txt(label, x + bs + 4, y, sz, F, BLK);
  };

  const underline = (text: string, x: number, y: number, sz = 8.5) => {
    txt(text, x, y, sz, FB, BLK);
    const w = FB.widthOfTextAtSize(text, sz);
    page.drawLine({ start: { x, y: y - 1.5 }, end: { x: x + w, y: y - 1.5 }, thickness: 0.6, color: BLK });
  };

  // ── Données (nettoyage des caractères de contrôle) ───────────────────────────
  const entName  = clean(data.donateur.raisonSociale || data.donateur.nom).toUpperCase();
  const entAdr1  = clean(data.donateur.adresse);
  const entAdr2  = [clean(data.donateur.codePostal), clean(data.donateur.ville)].filter(Boolean).join(" ");
  const assocAdr = [clean(data.association.adresse), [clean(data.association.codePostal), clean(data.association.ville)].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const qualite  = clean(data.association.qualiteOrganisme) || "Œuvre ou organisme d'intérêt général";
  const assocNom   = clean(data.association.nom);
  const assocObjet = clean(data.association.objetSocial);
  const articleFiscal = data.articleFiscal || "238bis";
  const formeDon      = data.formeDon      || "declaration_manuel";
  const natureDon     = data.natureDon     || "numeraire";

  let y = 806; // marge haute ~36px

  // ────────────────────────────────────────────────────────────────────────────
  //  1. EN-TÊTE — rectangle unique pleine largeur, fond uniforme
  // ────────────────────────────────────────────────────────────────────────────
  const headerH = 82;
  const headerY = y - headerH;

  // Rectangle unique, même largeur que le montant (MX de marge)
  page.drawRectangle({ x: MX, y: headerY, width: W-MX*2, height: headerH, color: WHT, borderColor: NAVY, borderWidth: 1 });

  const encartW = MX + 110;
  const ordreW  = 130;
  const ordreX  = W - MX - ordreW;

  // Colonne gauche : ref CERFA
  txt("2041-MEC-SD", MX+10, headerY+66, 8, FB, NAVY);

  const ow = 54, oh = 17, ox = MX+10, oyt = headerY+60;
  const k = 0.552, orx = ow/2, ory = oh/2;
  const oval = `M ${orx} 0 C ${orx+k*orx} 0,${ow} ${ory-k*ory},${ow} ${ory} C ${ow} ${ory+k*ory},${orx+k*orx} ${oh},${orx} ${oh} C ${orx-k*orx} ${oh},0 ${ory+k*ory},0 ${ory} C 0 ${ory-k*ory},${orx-k*orx} 0,${orx} 0 Z`;
  page.drawSvgPath(oval, { x: ox, y: oyt, borderColor: NAVY, borderWidth: 1.2, color: WHT });
  const cwi = FI.widthOfTextAtSize("cerfa", 9.5);
  txt("cerfa", ox + (ow-cwi)/2, oyt - oh/2 - 3, 9.5, FI, NAVY);

  txt("N° Cerfa : 16216*03",  MX+10, headerY+36, 6.5, F, GREY);
  txt("Art. 238 bis C.G.I.", MX+10, headerY+26, 6.5, F, GREY);
  txt("(Entreprises)",        MX+10, headerY+14, 6.5, F, GREY);

  // Colonne droite : N° d'ordre
  txt("N° d'ordre du reçu", ordreX+6, headerY+64, 7, F, GREY);
  txt(data.numeroCerfa,     ordreX+6, headerY+44, 11.5, FB, NAVY);

  // Titre centré dans la colonne du milieu
  const midX = encartW + (ordreX - encartW) / 2;
  const t1 = "Reçu des dons et versements effectués par les entreprises";
  const t2 = "au titre de l'article 238 bis";
  const t3 = "du code général des impôts";
  txt(t1, midX - FB.widthOfTextAtSize(t1, 9)/2,   headerY+64, 9,   FB, NAVY);
  txt(t2, midX - F.widthOfTextAtSize(t2, 8.5)/2,  headerY+50, 8.5, F,  BLK);
  txt(t3, midX - F.widthOfTextAtSize(t3, 8.5)/2,  headerY+36, 8.5, F,  BLK);

  y = headerY - 2;

  // ────────────────────────────────────────────────────────────────────────────
  //  2. IDENTITÉ — bordure + séparateur vertical
  // ────────────────────────────────────────────────────────────────────────────
  const idH = 68;
  const idY = y - idH;

  // 2e rectangle : fond blanc, aucune bordure, aucun séparateur
  page.drawRectangle({ x: MX, y: idY, width: W-MX*2, height: idH, color: WHT, borderWidth: 0 });

  // Logo + nom asso (gauche), aligné sur MX+10 comme le bloc cerfa
  const startX = MX + 10;
  let logoEndX = startX;
  const logoSrc = data.association.logoUrl?.split("?")[0];
  if (logoSrc) {
    try {
      const imgD = await loadImageBytes(logoSrc);
      if (imgD) {
        const li = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(54 / li.width, 38 / li.height);
        const lw = li.width * sc, lh = li.height * sc;
        page.drawImage(li, { x: startX, y: idY + (idH - lh)/2, width: lw, height: lh });
        logoEndX = startX + lw + 8;
      }
    } catch { /* ignoré */ }
  }
  txt(assocNom.toUpperCase(), logoEndX, idY + idH - 16, 9.5, FB, NAVY);
  const assocAdr1 = clean(data.association.adresse);
  if (assocAdr1) txt(assocAdr1, logoEndX, idY + idH - 30, 8, F, GREY);
  const assocVille = [clean(data.association.codePostal), clean(data.association.ville)].filter(Boolean).join(" ");
  if (assocVille) txt(assocVille, logoEndX, idY + idH - 42, 8, F, GREY);
  const assocPays = data.association.pays || "France";
  txt(clean(assocPays), logoEndX, idY + idH - 54, 8, F, GREY);

  // Entreprise (droite)
  const entX = W/2 + 12;
  txt(entName, entX, idY + idH - 14, 10.5, FB, BLK);
  if (entAdr1) txt(entAdr1, entX, idY + idH - 29, 8.5, F, BLK);
  if (entAdr2) txt(entAdr2, entX, idY + idH - 42, 8.5, F, BLK);

  y = idY - 4;

  // ────────────────────────────────────────────────────────────────────────────
  //  3. BÉNÉFICIAIRE DU DON
  // ────────────────────────────────────────────────────────────────────────────
  bar(y - 20, "BÉNÉFICIAIRE DU DON");
  y -= 24;

  const objetLines = assocObjet ? wrapText(assocObjet, F, 8.5, 365) : [];
  const nObjLines = Math.min(3, objetLines.length);

  const benPad = 12; // padding haut = bas
  let benH = 14 + 14; // NOM + ADRESSE (correspond aux décréments de fy)
  if (objetLines.length > 0) benH += Math.max(13, nObjLines * 12); // idem fy movement
  // QUALITE est le dernier champ, pas de décrément → benPad gère l'espace bas
  benH += benPad * 2;

  box(MX, y - benH, W - MX*2, benH);

  let fy = y - benPad;
  field("NOM OU DENOMINATION :", assocNom, MX+8, fy);
  fy -= 14;
  field("ADRESSE ASSOCIATION :", assocAdr, MX+8, fy);
  fy -= 14;
  if (objetLines.length > 0) {
    txt("OBJET :", MX+8, fy, 7.5, FB, NAVY);
    objetLines.slice(0, 3).forEach((line, i) => txt(line, MX+8+160, fy - i*12, 8.5, F, BLK));
    fy -= Math.max(13, nObjLines * 12);
  }
  field("QUALITÉ DE L'ORGANISME :", qualite, MX+8, fy);

  y -= benH + 16;

  // ────────────────────────────────────────────────────────────────────────────
  //  4. MONTANT
  // ────────────────────────────────────────────────────────────────────────────
  const legalR = "Le bénéficiaire reconnaît avoir reçu au titre des dons et versements ouvrant droit à réduction d'impôt, la somme de :";
  txt(legalR, MX, y, 7.5, F, GREY);
  y -= 10;

  const montantStr = data.montant.toFixed(2).replace(".", ",");
  const lettresStr = montantEnLettres(data.montant);
  const montH = 40;
  page.drawRectangle({ x: MX, y: y-montH, width: W-MX*2, height: montH, color: WHT, borderColor: NAVY, borderWidth: 1 });

  const starsStr = "***";
  const sw  = F.widthOfTextAtSize(starsStr, 9);
  const mw  = FB.widthOfTextAtSize(montantStr, 12);
  const ew  = FB.widthOfTextAtSize(" Euros", 12);
  const lw3 = FB.widthOfTextAtSize(lettresStr, 10);
  const tot = sw + 4 + mw + ew + 4 + sw + 14 + lw3;
  let cx = MX + (W - MX*2 - tot) / 2;
  const my = y - montH/2 - 4;
  txt(starsStr,   cx, my, 9,  F,  GREY); cx += sw + 4;
  txt(montantStr, cx, my, 12, FB, BLK);  cx += mw;
  txt(" Euros",   cx, my, 12, FB, BLK);  cx += ew + 4;
  txt(starsStr,   cx, my, 9,  F,  GREY); cx += sw + 14;
  txt(lettresStr, cx, my, 10, FB, BLK);

  y -= montH + 8;

  // ────────────────────────────────────────────────────────────────────────────
  //  5. DONATEUR (entreprise)
  // ────────────────────────────────────────────────────────────────────────────
  bar(y - 20, "DONATEUR");
  y -= 24;

  const siren = clean(data.donateur.siretDonateur);
  const objetDon = clean(data.objetDon);
  const donRows: { label: string; value: string }[] = [
    { label: "DENOMINATION DE L'ENTREPRISE :", value: entName },
    { label: "ADRESSE :",                       value: [entAdr1, entAdr2].filter(Boolean).join(", ") || "—" },
    ...(siren ? [{ label: "NUMÉRO SIREN :", value: siren }] : []),
    ...(objetDon ? [{ label: "OBJET DU DON :", value: objetDon }] : []),
  ];
  const donBoxH = 10 + donRows.length * 16;
  box(MX, y - donBoxH, W - MX*2, donBoxH);
  donRows.forEach(({ label, value }, i) => field(label, value, MX+8, y - 13 - i*16));

  y -= donBoxH + 16;

  // ────────────────────────────────────────────────────────────────────────────
  //  6. CERTIFICATION + CASES À COCHER
  // ────────────────────────────────────────────────────────────────────────────
  // Fond clair avec padding égal haut/bas (certPad)
  const certPad = 10;
  const certSectionH = 14 + 22 + 16 + 24 + 16 + 24 + 16 + 18; // c1+c2+titre article+cases+titre forme+cases+titre nature+cases
  page.drawRectangle({ x: MX, y: y - certSectionH - certPad, width: W-MX*2, height: certSectionH + certPad * 2, color: CERTBG, borderWidth: 0 });
  page.drawLine({ start: { x: MX, y: y + certPad }, end: { x: W-MX, y: y + certPad }, thickness: 0.4, color: BORDER });

  const c1 = "Le bénéficiaire certifie sur l'honneur que les dons et versements qu'il reçoit";
  const c2 = "ouvrent droit à la réduction d'impôt prévue à l'article";
  txt(c1, (W - FB.widthOfTextAtSize(c1, 8.5))/2, y,    8.5, FB, BLK);
  y -= 14;
  txt(c2, (W - FB.widthOfTextAtSize(c2, 8.5))/2, y, 8.5, FB, BLK);
  y -= 22;

  // Grille fixe 3 colonnes — la ligne de 4 utilise la même grille, la 4e dépasse
  const colW = (W - MX*2) / 3;
  const col  = (i: number) => MX + i * colW + 8;

  // Article CGI — titre + 3 cases
  underline("Article CGI", MX, y);
  y -= 16;
  ([
    { label: "200 du CGI",     val: "200"    },
    { label: "238 bis du CGI", val: "238bis" },
    { label: "978 du CGI",     val: "978"    },
  ] as const).forEach((opt, i) => cb(col(i), y, articleFiscal === opt.val, opt.label));
  y -= 24;

  // Forme du don — 3 cases alignées + "Autres" en bout de ligne
  underline("Forme du don", MX, y);
  y -= 16;
  ([
    { label: "Acte authentique",          val: "acte_authentique"   },
    { label: "Acte sous seing privé",     val: "ssp"                },
    { label: "Déclaration de don manuel", val: "declaration_manuel" },
  ] as const).forEach((opt, i) => cb(col(i), y, formeDon === opt.val, opt.label, 7.5));
  cb(W - MX - 58, y, formeDon === "autre", "Autres", 7.5);
  y -= 24;

  // Nature du don — 3 cases
  underline("Nature du don", MX, y);
  y -= 16;
  ([
    { label: "Numéraire",                 val: "numeraire"     },
    { label: "Titres de sociétés cotées", val: "nature"        },
    { label: "Autres",                    val: "abandon_frais" },
  ] as const).forEach((opt, i) => cb(col(i), y, natureDon === opt.val, opt.label));
  y -= 18;

  // Séparateur en bas du certbg (padding bas)
  page.drawLine({ start: { x: MX, y: y - certPad }, end: { x: W-MX, y: y - certPad }, thickness: 0.4, color: BORDER });
  y -= certPad + 16;

  // ────────────────────────────────────────────────────────────────────────────
  //  7. MODE DE VERSEMENT + SIGNATURE
  // ────────────────────────────────────────────────────────────────────────────
  // Mode de versement (gauche)
  txt("Mode de versement :", MX, y, 8, FB, NAVY);
  txt(MODES[data.modePaiement] || data.modePaiement, MX + 136, y, 9, FB, BLK);
  // Date du paiement réel sous le mode (ex: "du 15 janvier 2025")
  const dateDonStr = "du " + dateFr(data.dateDon);
  txt(dateDonStr, MX + 136, y - 14, 8.5, F, BLK);

  // Date et signature (droite — plus grand, bien centré)
  const sigX  = W / 2 + 10;
  const sigW2 = W - MX - sigX;
  const sigLabel = "Date et signature";
  const sigLabelW = FB.widthOfTextAtSize(sigLabel, 10);
  txt(sigLabel, sigX + (sigW2 - sigLabelW) / 2, y, 10, FB, NAVY);
  const dateStr = dateFr(data.dateEmission);
  const dateW = F.widthOfTextAtSize(dateStr, 9);
  txt(dateStr, sigX + (sigW2 - dateW) / 2, y - 16, 9, F, BLK);

  const sigSrc = data.association.signatureUrl?.split("?")[0];
  if (sigSrc) {
    try {
      const imgD = await loadImageBytes(sigSrc);
      if (imgD) {
        const si = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(sigW2 / si.width, 70 / si.height);
        const sw2 = si.width * sc, sh = si.height * sc;
        page.drawImage(si, { x: sigX + (sigW2 - sw2) / 2, y: y - 24 - sh, width: sw2, height: sh });
      }
    } catch { /* ignoré */ }
  }

  const representant = clean(data.association.representant);
  if (representant) {
    const rw = F.widthOfTextAtSize(representant, 7.5);
    txt(representant, sigX + (sigW2 - rw) / 2, y - 98, 7.5, F, GREY);
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  8. PIED DE PAGE
  // ────────────────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: MX, y: 48 }, end: { x: W-MX, y: 48 }, thickness: 0.5, color: BORDER });
  const foot = `Document établi conformément à l'article 238 bis du CGI — ${assocNom}`;
  txt(foot, (W - F.widthOfTextAtSize(foot, 7))/2, 34, 7, F, GREY);

  return doc.save();
}
