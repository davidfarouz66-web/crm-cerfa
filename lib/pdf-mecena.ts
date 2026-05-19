import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { montantEnLettres } from "./pdf";

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
    page.drawRectangle({ x: 0, y, width: W, height: h, color: NAVY, borderWidth: 0 });
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

  // ── Données ──────────────────────────────────────────────────────────────────
  const entName  = (data.donateur.raisonSociale || data.donateur.nom).toUpperCase();
  const entAdr1  = data.donateur.adresse || "";
  const entAdr2  = [data.donateur.codePostal, data.donateur.ville].filter(Boolean).join(" ");
  const assocAdr = [data.association.adresse, [data.association.codePostal, data.association.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const qualite  = data.association.qualiteOrganisme || "Œuvre ou organisme d'intérêt général";
  const articleFiscal = data.articleFiscal || "238bis";
  const formeDon      = data.formeDon      || "declaration_manuel";
  const natureDon     = data.natureDon     || "numeraire";

  let y = 842;

  // ────────────────────────────────────────────────────────────────────────────
  //  1. EN-TÊTE
  // ────────────────────────────────────────────────────────────────────────────
  const headerH = 80;
  const headerY = y - headerH;
  page.drawRectangle({ x: MX, y: headerY, width: W-MX*2, height: headerH, color: WHT, borderColor: NAVY, borderWidth: 1 });

  // Encart CERFA gauche
  const encartW = 105;
  page.drawRectangle({ x: MX, y: headerY, width: encartW, height: headerH, color: LGREY, borderWidth: 0 });
  page.drawLine({ start: { x: MX+encartW, y: headerY }, end: { x: MX+encartW, y: headerY+headerH }, thickness: 0.6, color: BORDER });

  txt("2041-MEC-SD", MX+6, headerY+66, 8, FB, NAVY);

  // Oval cerfa
  const ow = 54, oh = 17, ox = MX+6, oyt = headerY+60;
  const k = 0.552, orx = ow/2, ory = oh/2;
  const oval = `M ${orx} 0 C ${orx+k*orx} 0,${ow} ${ory-k*ory},${ow} ${ory} C ${ow} ${ory+k*ory},${orx+k*orx} ${oh},${orx} ${oh} C ${orx-k*orx} ${oh},0 ${ory+k*ory},0 ${ory} C 0 ${ory-k*ory},${orx-k*orx} 0,${orx} 0 Z`;
  page.drawSvgPath(oval, { x: ox, y: oyt, borderColor: NAVY, borderWidth: 1.2, color: WHT });
  const cwi = FI.widthOfTextAtSize("cerfa", 9.5);
  txt("cerfa", ox + (ow-cwi)/2, oyt - oh/2 - 3, 9.5, FI, NAVY);

  txt("N° Cerfa : 16216*03",  MX+6, headerY+36, 6.5, F, GREY);
  txt("Art. 238 bis C.G.I.", MX+6, headerY+26, 6.5, F, GREY);
  txt("(Entreprises)",        MX+6, headerY+14, 6.5, F, GREY);

  // Boîte N° d'ordre droite
  const ordreW = 125;
  const ordreX = W - MX - ordreW;
  page.drawRectangle({ x: ordreX, y: headerY, width: ordreW, height: headerH, color: LGREY, borderWidth: 0 });
  page.drawLine({ start: { x: ordreX, y: headerY }, end: { x: ordreX, y: headerY+headerH }, thickness: 0.6, color: BORDER });
  txt("N° d'ordre du reçu", ordreX+6, headerY+64, 7, F, GREY);
  txt(data.numeroCerfa,     ordreX+6, headerY+44, 11.5, FB, NAVY);

  // Titre centré
  const midX = MX + encartW + (ordreX - MX - encartW) / 2;
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
  const idH = 54;
  const idY = y - idH;

  // Fond + bordure pleine largeur
  page.drawRectangle({ x: 0, y: idY, width: W, height: idH, color: WHT, borderColor: BORDER, borderWidth: 0.6 });
  // Séparateur vertical au centre
  page.drawLine({ start: { x: W/2, y: idY }, end: { x: W/2, y: idY+idH }, thickness: 0.6, color: BORDER });

  // Logo + nom asso (gauche)
  let logoEndX = MX;
  const logoSrc = data.association.logoUrl?.split("?")[0];
  if (logoSrc) {
    try {
      const imgD = await loadImageBytes(logoSrc);
      if (imgD) {
        const li = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(54 / li.width, 38 / li.height);
        const lw = li.width * sc, lh = li.height * sc;
        page.drawImage(li, { x: MX, y: idY + (idH - lh)/2, width: lw, height: lh });
        logoEndX = MX + lw + 8;
      }
    } catch { /* ignoré */ }
  }
  txt(data.association.nom.toUpperCase(), logoEndX, idY + idH - 16, 9.5, FB, NAVY);
  if (data.association.adresse) txt(data.association.adresse, logoEndX, idY + idH - 30, 8, F, GREY);
  const assocVille = [data.association.codePostal, data.association.ville].filter(Boolean).join(" ");
  if (assocVille) txt(assocVille, logoEndX, idY + idH - 42, 8, F, GREY);

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

  const objetLines = data.association.objetSocial
    ? wrapText(data.association.objetSocial, F, 8.5, 365) : [];
  const nObjLines = Math.min(3, objetLines.length);

  let benH = 14 + 14; // NOM + ADRESSE
  if (objetLines.length > 0) benH += 13 + nObjLines * 12;
  benH += 14 + 8; // QUALITE + padding

  box(MX, y - benH, W - MX*2, benH);

  let fy = y - 13;
  field("NOM OU DENOMINATION :", data.association.nom, MX+8, fy);
  fy -= 14;
  field("ADRESSE ASSOCIATION :", assocAdr, MX+8, fy);
  fy -= 14;
  if (objetLines.length > 0) {
    txt("OBJET :", MX+8, fy, 7.5, FB, NAVY);
    objetLines.slice(0, 3).forEach((line, i) => txt(line, MX+8+160, fy - i*12, 8.5, F, BLK));
    fy -= Math.max(13, nObjLines * 12);
  }
  field("QUALITÉ DE L'ORGANISME :", qualite, MX+8, fy);

  y -= benH + 6;

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

  y -= montH + 6;

  // ────────────────────────────────────────────────────────────────────────────
  //  5. DONATEUR (entreprise)
  // ────────────────────────────────────────────────────────────────────────────
  bar(y - 20, "DONATEUR");
  y -= 24;

  const siren = data.donateur.siretDonateur || "";
  const donRows: { label: string; value: string }[] = [
    { label: "DENOMINATION DE L'ENTREPRISE :", value: entName },
    { label: "ADRESSE :",                       value: [entAdr1, entAdr2].filter(Boolean).join(", ") || "—" },
    ...(siren ? [{ label: "NUMÉRO SIREN :", value: siren }] : []),
    ...(data.objetDon ? [{ label: "OBJET DU DON :", value: data.objetDon }] : []),
  ];
  const donBoxH = 10 + donRows.length * 16;
  box(MX, y - donBoxH, W - MX*2, donBoxH);
  donRows.forEach(({ label, value }, i) => field(label, value, MX+8, y - 13 - i*16));

  y -= donBoxH + 6;

  // ────────────────────────────────────────────────────────────────────────────
  //  6. CERTIFICATION + CASES À COCHER
  // ────────────────────────────────────────────────────────────────────────────
  // Fond clair sur toute la section
  const certSectionH = 16 + 26 + 24 + 24 + 24;
  page.drawRectangle({ x: 0, y: y - certSectionH, width: W, height: certSectionH + 4, color: CERTBG, borderWidth: 0 });
  page.drawLine({ start: { x: 0, y: y + 4 }, end: { x: W, y: y + 4 }, thickness: 0.4, color: BORDER });

  const c1 = "Le bénéficiaire certifie sur l'honneur que les dons et versements qu'il reçoit";
  const c2 = "ouvrent droit à la réduction d'impôt prévue à l'article";
  txt(c1, (W - FB.widthOfTextAtSize(c1, 8.5))/2, y,    8.5, FB, BLK);
  y -= 14;
  txt(c2, (W - FB.widthOfTextAtSize(c2, 8.5))/2, y, 8.5, FB, BLK);
  y -= 22;

  // Article CGI
  const artW = (W - MX*2) / 3;
  ([
    { label: "200 du CGI",     val: "200"    },
    { label: "238 bis du CGI", val: "238bis" },
    { label: "978 du CGI",     val: "978"    },
  ] as const).forEach((opt, i) => cb(MX + i * artW + 8, y, articleFiscal === opt.val, opt.label));
  y -= 24;

  // Forme du don
  underline("Forme du don", MX, y);
  y -= 16;
  const formeW = (W - MX*2) / 4;
  ([
    { label: "Acte authentique",          val: "acte_authentique"   },
    { label: "Acte sous seing privé",     val: "ssp"                },
    { label: "Déclaration de don manuel", val: "declaration_manuel" },
    { label: "Autres",                    val: "autre"              },
  ] as const).forEach((opt, i) => cb(MX + i * formeW + 4, y, formeDon === opt.val, opt.label, 7.5));
  y -= 24;

  // Nature du don
  underline("Nature du don", MX, y);
  y -= 16;
  const natW = (W - MX*2) / 3;
  ([
    { label: "Numéraire",                 val: "numeraire"     },
    { label: "Titres de sociétés cotées", val: "nature"        },
    { label: "Autres",                    val: "abandon_frais" },
  ] as const).forEach((opt, i) => cb(MX + i * natW + 8, y, natureDon === opt.val, opt.label));
  y -= 18;

  // Séparateur
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: 0.6, color: BORDER });
  y -= 18;

  // ────────────────────────────────────────────────────────────────────────────
  //  7. MODE DE VERSEMENT + SIGNATURE
  // ────────────────────────────────────────────────────────────────────────────
  txt("Mode de versement :", MX, y, 7.5, FB, NAVY);
  txt(MODES[data.modePaiement] || data.modePaiement, MX + 132, y, 9, FB, BLK);

  const sigX  = W / 2 + 20;
  const sigW2 = W - MX - sigX;
  txt("Date et signature", sigX, y, 7.5, FB, NAVY);
  txt(dateFr(data.dateEmission), sigX, y - 16, 8.5, F, BLK);

  const sigSrc = data.association.signatureUrl?.split("?")[0];
  if (sigSrc) {
    try {
      const imgD = await loadImageBytes(sigSrc);
      if (imgD) {
        const si = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(sigW2 / si.width, 55 / si.height);
        const sw2 = si.width * sc, sh = si.height * sc;
        page.drawImage(si, { x: sigX + (sigW2 - sw2)/2, y: y - 22 - sh, width: sw2, height: sh });
      }
    } catch { /* ignoré */ }
  }

  if (data.association.representant) {
    const rw = F.widthOfTextAtSize(data.association.representant, 7.5);
    txt(data.association.representant, sigX + (sigW2 - rw)/2, y - 82, 7.5, F, GREY);
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  8. PIED DE PAGE
  // ────────────────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 0, y: 48 }, end: { x: W, y: 48 }, thickness: 0.5, color: BORDER });
  const foot = `Document établi conformément à l'article 238 bis du CGI — ${data.association.nom}`;
  txt(foot, (W - F.widthOfTextAtSize(foot, 7))/2, 34, 7, F, GREY);

  return doc.save();
}
