import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const U = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf",
  "dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const D = ["","dix","vingt","trente","quarante","cinquante","soixante"];

function nEnLettres(n: number): string {
  if (n === 0) return "zéro";
  let r = "", m = n;
  if (m >= 1000) { const k = Math.floor(m/1000); r += k===1?"mille":nEnLettres(k)+" mille"; m%=1000; if(m>0)r+=" "; }
  if (m >= 100)  { const c = Math.floor(m/100);  r += c===1?"cent":U[c]+" cent"; m%=100; if(m===0&&c>1)r+="s"; else if(m>0)r+=" "; }
  if (m > 0) {
    if (m<20) r+=U[m];
    else if (m<70) { const d=Math.floor(m/10),u=m%10; r+=D[d]+(u===1?"-et-un":u>0?"-"+U[u]:""); }
    else if (m<80) r+="soixante-"+(m===71?"et-onze":U[m-60]);
    else if (m<90) r+="quatre-vingt"+(m===80?"s":"-"+U[m-80]);
    else r+="quatre-vingt-"+U[m-80];
  }
  return r;
}

export function montantEnLettres(montant: number): string {
  const e = Math.floor(montant), c = Math.round((montant - e) * 100);
  return nEnLettres(e) + (e > 1 ? " euros" : " euro") +
    (c > 0 ? " et " + nEnLettres(c) + (c > 1 ? " centimes" : " centime") : "");
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
//  COULEURS — palette teal (différente de la référence grise)
// ─────────────────────────────────────────────────────────────────────────────
const TEAL   = rgb(0.07, 0.47, 0.47);   // sections, labels
const BLK    = rgb(0,    0,    0   );
const WHT    = rgb(1,    1,    1   );
const GREY   = rgb(0.45, 0.45, 0.45);
const LGREY  = rgb(0.94, 0.97, 0.97);   // fond boîtes
const BORDER = rgb(0.65, 0.82, 0.80);   // bordures

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface CerfaData {
  numeroCerfa: string;
  donateur: {
    type: string; civilite?: string | null; nom: string; prenom?: string | null;
    raisonSociale?: string | null; adresse?: string | null;
    codePostal?: string | null; ville?: string | null;
  };
  dateDon: Date; montant: number; modePaiement: string;
  objetDon?: string | null; dateEmission: Date;
  articleFiscal?: string | null;
  formeDon?: string | null;
  natureDon?: string | null;
  association: {
    nom: string; adresse?: string | null; codePostal?: string | null; ville?: string | null;
    siret?: string | null; rna?: string | null; objetSocial?: string | null;
    qualiteOrganisme?: string | null; representant?: string | null;
    logoUrl?: string | null; signatureUrl?: string | null;
  };
}

const MODES: Record<string, string> = {
  virement: "Virement bancaire",
  cheque:   "Chèque",
  especes:  "Espèces",
  cb:       "Paiement en ligne",
};

// ─────────────────────────────────────────────────────────────────────────────
//  GÉNÉRATEUR — CERFA 2041-RD (Particuliers)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateCerfaPDF(data: CerfaData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const F    = await doc.embedFont(StandardFonts.Helvetica);
  const FB   = await doc.embedFont(StandardFonts.HelveticaBold);
  const FI   = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([595, 842]);
  const W    = 595;
  const MX   = 28;

  // ── Raccourcis ──────────────────────────────────────────────────────────────
  const txt = (text: string, x: number, y: number, sz: number, font = F, color = BLK) =>
    page.drawText(String(text), { x, y, size: sz, font, color });

  const box = (x: number, y: number, w: number, h: number, fill = LGREY) =>
    page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: BORDER, borderWidth: 0.5 });

  const bar = (y: number, label: string, h = 18) => {
    page.drawRectangle({ x: 0, y, width: W, height: h, color: TEAL, borderWidth: 0 });
    const lw = FB.widthOfTextAtSize(label, 8.5);
    txt(label, (W - lw) / 2, y + (h - 8.5) / 2 + 1, 8.5, FB, WHT);
  };

  const field = (label: string, value: string, x: number, y: number, labelW = 160) => {
    txt(label, x, y, 7.5, FB, TEAL);
    if (value) txt(value, x + labelW, y, 8.5, F, BLK);
  };

  const cb = (x: number, y: number, checked: boolean, label: string, sz = 8) => {
    const bs = 8;
    page.drawRectangle({ x, y: y - 1, width: bs, height: bs, color: WHT, borderColor: GREY, borderWidth: 0.6 });
    if (checked) {
      page.drawLine({ start: { x: x+1.5, y: y+3.5 }, end: { x: x+3,   y: y+1.5 }, thickness: 1.3, color: TEAL });
      page.drawLine({ start: { x: x+3,   y: y+1.5 }, end: { x: x+6.5, y: y+6.5 }, thickness: 1.3, color: TEAL });
    }
    txt(label, x + bs + 4, y, sz, F, BLK);
  };

  const underline = (text: string, x: number, y: number, font = FB, sz = 8.5) => {
    txt(text, x, y, sz, font, BLK);
    const w = font.widthOfTextAtSize(text, sz);
    page.drawLine({ start: { x, y: y - 1 }, end: { x: x + w, y: y - 1 }, thickness: 0.5, color: BLK });
  };

  // ── Données ──────────────────────────────────────────────────────────────────
  const dNom = data.donateur.type === "entreprise"
    ? (data.donateur.raisonSociale || data.donateur.nom).toUpperCase()
    : [data.donateur.civilite || "M.", data.donateur.prenom, data.donateur.nom].filter(Boolean).join(" ");
  const dAdr1    = data.donateur.adresse || "";
  const dAdr2    = [data.donateur.codePostal, data.donateur.ville].filter(Boolean).join(" ");
  const assocAdr = [data.association.adresse, [data.association.codePostal, data.association.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const siren    = data.association.rna || data.association.siret || "";
  const qualite  = data.association.qualiteOrganisme || "Œuvre ou organisme d'intérêt général";
  const articleFiscal = data.articleFiscal || "200";
  const formeDon      = data.formeDon      || "declaration_manuel";
  const natureDon     = data.natureDon     || "numeraire";

  let y = 842;

  // ────────────────────────────────────────────────────────────────────────────
  //  1. EN-TÊTE
  // ────────────────────────────────────────────────────────────────────────────
  const headerY = y - 80;
  page.drawRectangle({ x: MX, y: headerY, width: W - MX*2, height: 78, color: WHT, borderColor: TEAL, borderWidth: 0.8 });

  // Encart CERFA gauche
  page.drawRectangle({ x: MX, y: headerY, width: 100, height: 78, color: LGREY, borderWidth: 0 });
  page.drawLine({ start: { x: MX+100, y: headerY }, end: { x: MX+100, y: headerY+78 }, thickness: 0.5, color: BORDER });

  txt("2041-RD", MX + 6, headerY + 64, 8, FB, TEAL);

  // Oval cerfa
  const ow = 52, oh = 16, ox = MX + 6, oyt = headerY + 58;
  const k = 0.552, orx = ow/2, ory = oh/2;
  const oval = `M ${orx} 0 C ${orx+k*orx} 0,${ow} ${ory-k*ory},${ow} ${ory} C ${ow} ${ory+k*ory},${orx+k*orx} ${oh},${orx} ${oh} C ${orx-k*orx} ${oh},0 ${ory+k*ory},0 ${ory} C 0 ${ory-k*ory},${orx-k*orx} 0,${orx} 0 Z`;
  page.drawSvgPath(oval, { x: ox, y: oyt, borderColor: TEAL, borderWidth: 1, color: WHT });
  const cwi = FI.widthOfTextAtSize("cerfa", 9);
  txt("cerfa", ox + (ow - cwi)/2, oyt + 3, 9, FI, TEAL);

  txt("N° 11580*05",              MX+6, headerY+36, 6, F, GREY);
  txt("Art. 200 et 978 C.G.I.",   MX+6, headerY+26, 6, F, GREY);
  txt("(Particuliers)",            MX+6, headerY+16, 6, F, GREY);

  // Boîte N° d'ordre droite
  const ordreX = W - MX - 120;
  page.drawRectangle({ x: ordreX, y: headerY, width: 120, height: 78, color: LGREY, borderWidth: 0 });
  page.drawLine({ start: { x: ordreX, y: headerY }, end: { x: ordreX, y: headerY+78 }, thickness: 0.5, color: BORDER });
  txt("N° d'ordre du reçu", ordreX + 4, headerY + 62, 7, F, GREY);
  txt(data.numeroCerfa,     ordreX + 4, headerY + 44, 11, FB, TEAL);

  // Titre centré
  const midX = MX + 100 + (ordreX - MX - 100) / 2;
  const t1 = "Reçu des dons et versements";
  const t2 = "effectués par les particuliers au titre";
  const t3 = "des articles 200 et 978 du code général des impôts";
  txt(t1, midX - FB.widthOfTextAtSize(t1, 9.5)/2,  headerY+62, 9.5, FB, TEAL);
  txt(t2, midX - F.widthOfTextAtSize(t2, 8.5)/2,   headerY+48, 8.5, F,  BLK);
  txt(t3, midX - F.widthOfTextAtSize(t3, 7.5)/2,   headerY+34, 7.5, F,  BLK);

  y = headerY - 8;

  // ────────────────────────────────────────────────────────────────────────────
  //  2. IDENTITÉ (logo asso | infos donateur)
  // ────────────────────────────────────────────────────────────────────────────
  const idH = 48;
  const idY = y - idH;

  // Logo + nom asso (gauche)
  let logoEndX = MX;
  const logoSrc = data.association.logoUrl?.split("?")[0];
  if (logoSrc) {
    try {
      const imgD = await loadImageBytes(logoSrc);
      if (imgD) {
        const li = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(52 / li.width, 36 / li.height);
        const lw = li.width * sc, lh = li.height * sc;
        page.drawImage(li, { x: MX, y: idY + (idH - lh)/2, width: lw, height: lh });
        logoEndX = MX + lw + 6;
      }
    } catch { /* ignoré */ }
  }
  txt(data.association.nom.toUpperCase(), logoEndX, y - 20, 9, FB, TEAL);

  // Donateur (droite)
  const donX = W / 2 + 10;
  txt(dNom.toUpperCase(), donX, y - 12, 10, FB, BLK);
  if (dAdr1) txt(dAdr1, donX, y - 26, 8.5, F, BLK);
  if (dAdr2) txt(dAdr2, donX, y - 39, 8.5, F, BLK);

  y = idY - 6;

  // ────────────────────────────────────────────────────────────────────────────
  //  3. BÉNÉFICIAIRE DU DON
  // ────────────────────────────────────────────────────────────────────────────
  bar(y - 18, "BÉNÉFICIAIRE DU DON");
  y -= 22;

  const objetLines = data.association.objetSocial
    ? wrapText(data.association.objetSocial, F, 8.5, 360) : [];
  const nObjLines  = Math.max(1, Math.min(3, objetLines.length));
  const benH = 16 + 14 + 14 + (nObjLines * 13) + 14 + 10;

  box(MX, y - benH, W - MX*2, benH);

  let fy = y - 12;
  field("NOM OU DENOMINATION :",    data.association.nom,         MX+8, fy);
  fy -= 14;
  field("NUMÉRO SIREN OU RNA :",    siren,                        MX+8, fy);
  fy -= 14;
  field("ADRESSE ASSOCIATION :",    assocAdr,                     MX+8, fy);
  fy -= 14;
  if (objetLines.length > 0) {
    txt("OBJET :", MX+8, fy, 7.5, FB, TEAL);
    objetLines.slice(0, 3).forEach((line, i) => txt(line, MX+8+160, fy - i*13, 8.5, F, BLK));
    fy -= nObjLines * 13;
  } else {
    fy -= 13;
  }
  field("QUALITÉ DE L'ORGANISME :", qualite,                      MX+8, fy);

  y -= benH + 8;

  // ────────────────────────────────────────────────────────────────────────────
  //  4. MONTANT
  // ────────────────────────────────────────────────────────────────────────────
  const legalR = "Le bénéficiaire reconnaît avoir reçu au titre des dons et versements ouvrant droit à réduction d'impôt, la somme de :";
  txt(legalR, MX, y, 7.5, F, GREY);
  y -= 14;

  const montantStr = data.montant.toFixed(2).replace(".", ",");
  const lettresStr = montantEnLettres(data.montant);
  page.drawRectangle({ x: MX, y: y-30, width: W-MX*2, height: 34, color: WHT, borderColor: TEAL, borderWidth: 0.8 });

  const starsStr = "***";
  const sw  = F.widthOfTextAtSize(starsStr, 8.5);
  const mw  = FB.widthOfTextAtSize(montantStr, 11);
  const ew  = FB.widthOfTextAtSize(" Euros", 11);
  const lw3 = FB.widthOfTextAtSize(lettresStr, 9.5);
  const tot = sw + 4 + mw + ew + 4 + sw + 12 + lw3;
  let cx = MX + (W - MX*2 - tot) / 2;
  txt(starsStr,    cx, y-20, 8.5, F,  GREY); cx += sw + 4;
  txt(montantStr,  cx, y-20, 11,  FB, BLK);  cx += mw;
  txt(" Euros",    cx, y-20, 11,  FB, BLK);  cx += ew + 4;
  txt(starsStr,    cx, y-20, 8.5, F,  GREY); cx += sw + 12;
  txt(lettresStr,  cx, y-20, 9.5, FB, BLK);

  y -= 42;

  // ────────────────────────────────────────────────────────────────────────────
  //  5. DONATEUR
  // ────────────────────────────────────────────────────────────────────────────
  bar(y - 18, "DONATEUR");
  y -= 22;

  const donBoxH = 46;
  box(MX, y - donBoxH, W - MX*2, donBoxH);
  field("NOM OU DENOMINATION :", dNom, MX+8, y-12);
  field("ADRESSE DONATEUR :",    [dAdr1, dAdr2].filter(Boolean).join(", "), MX+8, y-28);

  y -= donBoxH + 10;

  // ────────────────────────────────────────────────────────────────────────────
  //  6. CERTIFICATION
  // ────────────────────────────────────────────────────────────────────────────
  const c1 = "Le bénéficiaire certifie sur l'honneur que les dons et versements qu'il reçoit";
  const c2 = "ouvrent droit à la réduction d'impôt prévue à l'article";
  txt(c1, (W - FB.widthOfTextAtSize(c1, 8.5))/2, y,    8.5, FB, BLK);
  txt(c2, (W - FB.widthOfTextAtSize(c2, 8.5))/2, y-13, 8.5, FB, BLK);
  y -= 26;

  // Article CGI
  const artW = (W - MX*2) / 3;
  ([
    { label: "200 du CGI",     val: "200"    },
    { label: "238 bis du CGI", val: "238bis" },
    { label: "978 du CGI",     val: "978"    },
  ] as const).forEach((opt, i) => cb(MX + i * artW + 6, y, articleFiscal === opt.val, opt.label));
  y -= 22;

  // Forme du don
  underline("Forme du don", MX, y);
  y -= 16;
  const formeW = (W - MX*2) / 4;
  ([
    { label: "Acte authentique",        val: "acte_authentique"   },
    { label: "Acte sous seing privé",   val: "ssp"                },
    { label: "Déclaration de don manuel", val: "declaration_manuel" },
    { label: "Autres",                  val: "autre"              },
  ] as const).forEach((opt, i) => cb(MX + i * formeW + 2, y, formeDon === opt.val, opt.label, 7.5));
  y -= 22;

  // Nature du don
  underline("Nature du don", MX, y);
  y -= 16;
  const natW = (W - MX*2) / 3;
  ([
    { label: "Numéraire",                 val: "numeraire"     },
    { label: "Titres de sociétés cotées", val: "nature"        },
    { label: "Autres",                    val: "abandon_frais" },
  ] as const).forEach((opt, i) => cb(MX + i * natW + 6, y, natureDon === opt.val, opt.label));
  y -= 20;

  // Séparateur
  page.drawLine({ start: { x: MX, y }, end: { x: W-MX, y }, thickness: 0.4, color: BORDER });
  y -= 20;

  // ────────────────────────────────────────────────────────────────────────────
  //  7. MODE DE VERSEMENT + SIGNATURE
  // ────────────────────────────────────────────────────────────────────────────
  txt("Mode de versement :", MX, y, 7.5, FB, TEAL);
  txt(MODES[data.modePaiement] || data.modePaiement, MX + 132, y, 8.5, FB, BLK);

  const sigX  = W / 2 + 20;
  const sigW2 = W - MX - sigX;
  txt("Date et signature", sigX, y, 7.5, FB, TEAL);
  txt(dateFr(data.dateEmission), sigX, y - 14, 8.5, F, BLK);

  // Image signature
  const sigSrc = data.association.signatureUrl?.split("?")[0];
  if (sigSrc) {
    try {
      const imgD = await loadImageBytes(sigSrc);
      if (imgD) {
        const si = imgD.ext === "jpg" || imgD.ext === "jpeg"
          ? await doc.embedJpg(imgD.bytes) : await doc.embedPng(imgD.bytes);
        const sc = Math.min(sigW2 / si.width, 52 / si.height);
        const sw2 = si.width * sc, sh = si.height * sc;
        page.drawImage(si, { x: sigX + (sigW2 - sw2)/2, y: y - 20 - sh, width: sw2, height: sh });
      }
    } catch { /* ignoré */ }
  }

  if (data.association.representant) {
    const rw = F.widthOfTextAtSize(data.association.representant, 7);
    txt(data.association.representant, sigX + (sigW2 - rw)/2, y - 78, 7, F, GREY);
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  8. PIED DE PAGE
  // ────────────────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: MX, y: 45 }, end: { x: W-MX, y: 45 }, thickness: 0.4, color: BORDER });
  const foot = `Document établi conformément aux articles 200 et 978 du CGI — ${data.association.nom}`;
  txt(foot, (W - F.widthOfTextAtSize(foot, 7))/2, 32, 7, F, GREY);

  return doc.save();
}
