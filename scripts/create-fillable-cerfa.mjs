/**
 * Script one-shot : génère cerfa-fillable.pdf avec champs AcroForm.
 * Relancer si le template de base change.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tb  = readFileSync(path.join(cwd, "public/templates/cerfa-blank.pdf"));
const doc = await PDFDocument.load(tb);

try { doc.getForm().flatten(); } catch {}

const [page] = doc.getPages();
const F  = await doc.embedFont(StandardFonts.Helvetica);
const FB = await doc.embedFont(StandardFonts.HelveticaBold);
const BLK = rgb(0, 0, 0);
const WHT = rgb(1, 1, 1);

// Efface la ligne "___Euros___" du template → gérée en drawText dans pdf.ts
page.drawRectangle({ x: 138, y: 452, width: 350, height: 14, color: WHT, borderWidth: 0 });

// Efface le pied de page "www.votresite.fr"
page.drawRectangle({ x: 50, y: 32, width: 500, height: 16, color: WHT, borderWidth: 0 });

// Efface la ligne entière (label + tirets) du bloc donateur haut droite
// Les données seront affichées directement sans label devant, toutes alignées à x=315
page.drawRectangle({ x: 312, y: 693, width: 241, height: 16, color: WHT, borderWidth: 0 }); // ligne nom
page.drawRectangle({ x: 312, y: 676, width: 241, height: 16, color: WHT, borderWidth: 0 }); // ligne adresse
page.drawRectangle({ x: 312, y: 659, width: 241, height: 16, color: WHT, borderWidth: 0 }); // ligne ville

const form = doc.getForm();

function addField(name, x, y, w, h, opts = {}) {
  const field = form.createTextField(name);
  field.addToPage(page, {
    x, y, width: w, height: h,
    textColor: BLK,
    borderWidth: 0,
    ...(opts.whiteBg ? { backgroundColor: WHT } : {}),
  });
  field.setFontSize(opts.size ?? 9.5);
  if (opts.multiline) field.enableMultiline();
  field.updateAppearances(opts.bold ? FB : F);
}

// ── Bloc donateur haut droite — alignement parfait, sans labels ──────────────
// Les 3 champs partent du même x=425, pleine largeur jusqu'à x=548
addField("donateur_nom",      425, 692, 123, 14, { whiteBg: true, bold: true });
addField("donateur_adresse",  425, 679, 123, 13, { whiteBg: true });
addField("donateur_ville",    425, 666, 123, 11, { whiteBg: true });

// ── Section Bénéficiaire — alignés sur le label le plus long ────────────────
// "ADRESSE DE L'ASSOCIATION :" finit à ≈x=228 → tous les champs partent de x=228
addField("benef_nom",         228, 614, 322, 13);
addField("benef_siren",       228, 594, 322, 13);
addField("benef_adresse",     228, 574, 322, 13);

// ── Section DONATEUR bas ─────────────────────────────────────────────────────
addField("don_nom",           195, 390, 355, 13);
addField("don_adresse",       195, 367, 355, 13);

// ── Mode de versement ────────────────────────────────────────────────────────
addField("mode_paiement",     160, 136, 175, 13, { bold: true });

// Champs dessinés manuellement dans pdf.ts après flatten() :
// numero_cerfa, assoc_nom, benef_objet, qualite, montant (chiffre+lettres), date_emission

mkdirSync(path.join(cwd, "public/templates"), { recursive: true });
writeFileSync(path.join(cwd, "public/templates/cerfa-fillable.pdf"), await doc.save());

const fields = form.getFields();
console.log(`✓ cerfa-fillable.pdf — ${fields.length} champs AcroForm :`);
fields.forEach(f => console.log(`  - ${f.getName()}`));
