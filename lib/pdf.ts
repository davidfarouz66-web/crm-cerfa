import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { existsSync, readFileSync } from "fs";
import path from "path";

// ─── Montant en lettres ───────────────────────────────────────────────────────
const U = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
  'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
const D = ['','dix','vingt','trente','quarante','cinquante','soixante'];

function nEnLettres(n: number): string {
  if (n === 0) return 'zéro';
  let r = '', m = n;
  if (m >= 1000) { const k = Math.floor(m/1000); r += k===1?'mille':nEnLettres(k)+' mille'; m%=1000; if(m>0)r+=' '; }
  if (m >= 100)  { const c = Math.floor(m/100);  r += c===1?'cent':U[c]+' cent'; m%=100; if(m===0&&c>1)r+='s'; else if(m>0)r+=' '; }
  if (m > 0) {
    if (m<20) r+=U[m];
    else if (m<70) { const d=Math.floor(m/10),u=m%10; r+=D[d]+(u===1?'-et-un':u>0?'-'+U[u]:''); }
    else if (m<80) r+='soixante-'+(m===71?'et-onze':U[m-60]);
    else if (m<90) r+='quatre-vingt'+(m===80?'s':'-'+U[m-80]);
    else r+='quatre-vingt-'+U[m-80];
  }
  return r;
}

export function montantEnLettres(montant: number): string {
  const e = Math.floor(montant), c = Math.round((montant - e) * 100);
  return nEnLettres(e) + (e > 1 ? ' euros' : ' euro') +
    (c > 0 ? ' et ' + nEnLettres(c) + (c > 1 ? ' centimes' : ' centime') : '');
}

function dateFr(date: Date): string {
  const m = ['janvier','février','mars','avril','mai','juin','juillet','août',
             'septembre','octobre','novembre','décembre'];
  const d = new Date(date);
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

// Word-wrap text into lines of at most maxWidth PDF units
function wrapText(text: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
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

interface CerfaData {
  numeroCerfa: string;
  donateur: {
    type: string; civilite?: string|null; nom: string; prenom?: string|null;
    raisonSociale?: string|null; adresse?: string|null; codePostal?: string|null; ville?: string|null;
  };
  dateDon: Date; montant: number; modePaiement: string;
  objetDon?: string|null; dateEmission: Date;
  association: {
    nom: string; adresse?: string|null; codePostal?: string|null; ville?: string|null;
    siret?: string|null; rna?: string|null; objetSocial?: string|null;
    qualiteOrganisme?: string|null; representant?: string|null;
    logoUrl?: string|null; signatureUrl?: string|null;
  };
}

const MODES: Record<string, string> = {
  virement: 'Virement bancaire',
  cheque:   'Chèque',
  especes:  'Espèces',
  cb:       'Paiement en ligne',
};

const BLK = rgb(0, 0, 0);
const WHT = rgb(1, 1, 1);

export async function generateCerfaPDF(data: CerfaData): Promise<Uint8Array> {
  const fillablePath = path.join(process.cwd(), 'public', 'templates', 'cerfa-fillable.pdf');
  const blankPath    = path.join(process.cwd(), 'public', 'templates', 'cerfa-blank.pdf');
  const templatePath = existsSync(fillablePath) ? fillablePath : blankPath;
  const doc = await PDFDocument.load(readFileSync(templatePath));

  const F  = await doc.embedFont(StandardFonts.Helvetica);
  const FB = await doc.embedFont(StandardFonts.HelveticaBold);
  const [page] = doc.getPages();
  const W = page.getWidth();

  // ── Données calculées ──────────────────────────────────────────────────────
  const dNom = data.donateur.type === 'entreprise'
    ? (data.donateur.raisonSociale || data.donateur.nom).toUpperCase()
    : [data.donateur.civilite || 'M.', data.donateur.prenom, data.donateur.nom]
        .filter(Boolean).join(' ').toUpperCase();

  const dA1 = data.donateur.adresse || '';
  const dA2 = [data.donateur.codePostal, data.donateur.ville].filter(Boolean).join(' ');

  const assocAdr = [
    data.association.adresse,
    [data.association.codePostal, data.association.ville].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  // ── Remplissage des champs AcroForm ──────────────────────────────────────
  const form = doc.getForm();

  const set = (name: string, value: string, bold = false) => {
    try {
      const field = form.getTextField(name);
      field.setText(value || '');
      field.updateAppearances(bold ? FB : F);
    } catch { /* champ absent si fallback sur cerfa-blank */ }
  };

  set('donateur_nom',     dNom,                                               true);
  set('donateur_adresse', dA1);
  set('donateur_ville',   dA2);
  set('benef_nom',        data.association.nom);
  set('benef_siren',      data.association.rna || data.association.siret || '');
  set('benef_adresse',    assocAdr);
  set('don_nom',          dNom);
  set('don_adresse',      [dA1, dA2].filter(Boolean).join(', '));
  set('mode_paiement',    MODES[data.modePaiement] || data.modePaiement,      true);

  // ── Descend la barre "BÉNÉFICIAIRE DU DON" (avant flatten) ─────────────────
  // Barre originale centrée en y≈650 (h≈20). On la couvre et on la redessine 12pt plus bas.
  // Descend la barre de 6pt (originale ≈ y=640-660) pour dégager le code postal
  const NAVY = rgb(0.09, 0.19, 0.44);
  page.drawRectangle({ x: 0, y: 636, width: W, height: 28, color: WHT, borderWidth: 0 });
  page.drawRectangle({ x: 0, y: 632, width: W, height: 20, color: NAVY, borderWidth: 0 });
  const barLabel = 'BÉNÉFICIAIRE DU DON';
  page.drawText(barLabel, {
    x: (W - FB.widthOfTextAtSize(barLabel, 9)) / 2, y: 639,
    size: 9, font: FB, color: WHT,
  });

  // ── Logo (avant flatten) ──────────────────────────────────────────────────
  const logoSrc = data.association.logoUrl?.split('?')[0];
  let assocNameY = 703;
  if (logoSrc) {
    try {
      const lp = path.join(process.cwd(), 'public', logoSrc);
      if (existsSync(lp)) {
        const lb = readFileSync(lp);
        const ext = lp.split('.').pop()?.toLowerCase();
        const li = (ext === 'jpg' || ext === 'jpeg') ? await doc.embedJpg(lb) : await doc.embedPng(lb);
        const sc = Math.min(100 / li.width, 40 / li.height);
        const lw = li.width * sc, lh = li.height * sc;
        page.drawImage(li, { x: 45, y: 738 - lh, width: lw, height: lh });
        assocNameY = 738 - lh - 14;
      }
    } catch { /* ignoré */ }
  }

  // ── Aplatissement ────────────────────────────────────────────────────────
  form.flatten();

  // ── Tout ce qui suit est dessiné PAR-DESSUS le PDF aplati ────────────────

  // Nom association (bleu, position dynamique selon logo)
  page.drawText(data.association.nom, {
    x: 45, y: assocNameY, size: 9.5, font: FB, color: rgb(0.13, 0.25, 0.55),
  });

  // N° d'ordre (coin haut droit, dans le carré bleu, aligné à droite)
  const numStr = data.numeroCerfa;
  const numSz = 10;
  const numW = FB.widthOfTextAtSize(numStr, numSz);
  // Le carré bleu occupe environ x=440 à x=550 — on aligne à droite dans x≈548
  page.drawText(numStr, {
    x: 546 - numW, y: 793, size: numSz, font: FB, color: BLK,
  });

  // Objet social — aligné à x=228, même colonne que NOM/SIREN/ADRESSE
  // Démarre sur la même ligne que le label "OBJET :" (y=561), 4 lignes max espacées de 12pt
  const objetText = data.association.objetSocial || '';
  if (objetText) {
    const objetLines = wrapText(objetText, F, 9, 322); // 550 - 228
    const objetYs = [561, 549, 537, 525];
    objetLines.slice(0, 4).forEach((line, i) => {
      page.drawText(line, { x: 228, y: objetYs[i], size: 9, font: F, color: BLK });
    });
  }

  // Qualité de l'organisme — alignée à x=228, même colonne
  const qualite = data.association.qualiteOrganisme || "Oeuvre ou organisme d'intérêt général";
  page.drawText(qualite, { x: 228, y: 510, size: 9.5, font: F, color: BLK });

  // Ligne du montant : ***chiffre Euros***  lettres
  // Zone effacée dans cerfa-fillable.pdf : x=138 à x=488, y=452, h=14
  const montantStr = data.montant.toFixed(2).replace('.', ',');
  const montantSz = 10;
  const lettresSz = 9.5;
  const stars = '***';
  const starsSz = 9;
  const GREY = rgb(0.55, 0.55, 0.55);

  // Groupe 1 : ***chiffre Euros*** (centré dans la première moitié de la zone)
  const starsW   = F.widthOfTextAtSize(stars, starsSz);
  const chiffreW = FB.widthOfTextAtSize(montantStr, montantSz);
  const eurosStr = ' Euros';
  const eurosW   = F.widthOfTextAtSize(eurosStr, montantSz);
  const groupe1W = starsW + 3 + chiffreW + eurosW + 3 + starsW;

  const lettresStr = montantEnLettres(data.montant);
  const lettresW   = FB.widthOfTextAtSize(lettresStr, lettresSz);
  const sep = 8; // espace entre les *** et les lettres

  const totalW = groupe1W + sep + lettresW;
  const zoneX = 138, zoneW = 350;
  let cx = zoneX + (zoneW - totalW) / 2;

  page.drawText(stars,      { x: cx, y: 459, size: starsSz,   font: F,  color: GREY }); cx += starsW + 3;
  page.drawText(montantStr, { x: cx, y: 459, size: montantSz, font: FB, color: BLK  }); cx += chiffreW;
  page.drawText(eurosStr,   { x: cx, y: 459, size: montantSz, font: FB, color: BLK  }); cx += eurosW + 3;
  page.drawText(stars,      { x: cx, y: 459, size: starsSz,   font: F,  color: GREY }); cx += starsW + sep;
  page.drawText(lettresStr, { x: cx, y: 459, size: lettresSz, font: FB, color: BLK  });

  // Date d'émission (dans la zone signature, y=125, à droite)
  const dateStr = dateFr(data.dateEmission);
  const dateSz = 9.5;
  const dateW = F.widthOfTextAtSize(dateStr, dateSz);
  // Zone signature : x=413 à x=553 → centré
  page.drawText(dateStr, {
    x: 413 + (140 - dateW) / 2, y: 122, size: dateSz, font: F, color: BLK,
  });

  // Signature / Cachet
  const sigSrc = data.association.signatureUrl?.split('?')[0];
  if (sigSrc) {
    try {
      const sp = path.join(process.cwd(), 'public', sigSrc);
      if (existsSync(sp)) {
        const sb = readFileSync(sp);
        const ext = sp.split('.').pop()?.toLowerCase();
        const si = (ext === 'jpg' || ext === 'jpeg') ? await doc.embedJpg(sb) : await doc.embedPng(sb);
        const sc = Math.min(130 / si.width, 56 / si.height);
        const sw = si.width * sc, sh = si.height * sc;
        page.drawImage(si, { x: 413 + (140 - sw) / 2, y: 98 + (40 - sh) / 2, width: sw, height: sh });
      }
    } catch { /* ignoré */ }
  }

  // Nom et qualité du signataire (mention légale obligatoire)
  if (data.association.representant) {
    const repSz = 7.5;
    const repLines = wrapText(data.association.representant, F, repSz, 130);
    repLines.slice(0, 2).forEach((line, i) => {
      const lw = F.widthOfTextAtSize(line, repSz);
      page.drawText(line, {
        x: 413 + (140 - lw) / 2,
        y: 88 - i * 10,
        size: repSz, font: F, color: rgb(0.3, 0.3, 0.3),
      });
    });
  }

  // Pied de page
  const foot = `Document généré conformément à l'article 200 du CGI — ${data.association.nom}`;
  const footSz = 7.5;
  page.drawText(foot, {
    x: (W - F.widthOfTextAtSize(foot, footSz)) / 2,
    y: 40,
    size: footSz, font: F, color: rgb(0.4, 0.4, 0.4),
  });

  return doc.save();
}
