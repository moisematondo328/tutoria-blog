// Génère un PDF réel, à la charte Tutoria Academy, pour une leçon.
// Rendu server-side au build (pdfkit), à partir du markdown de la leçon (marked).
// Aucune dépendance navigateur : le fichier .pdf est écrit en statique dans dist.
import PDFDocument from 'pdfkit';
import { marked } from 'marked';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Polices embarquées (TTF complets) -> même identité que le site.
// Chargées depuis la racine projet (présente au build statique).
const fontPath = (f: string) => join(process.cwd(), 'src/assets/pdf-fonts', f);
const FONTS = {
  body: readFileSync(fontPath('Montserrat-Regular.ttf')),
  med: readFileSync(fontPath('Montserrat-Medium.ttf')),
  semi: readFileSync(fontPath('Montserrat-SemiBold.ttf')),
  display: readFileSync(fontPath('Montserrat-ExtraBold.ttf')),
};

// Palette (tokens Academy)
const C = {
  ink: '#0A2621',
  teal: '#0E8074',
  tealD: '#0B6E64',
  tealL: '#17B39D',
  yellow: '#FDD200',
  paper: '#F2F6F3',
  tint: '#E6F1EE',
  line: '#DBE7E2',
  muted: '#5B726B',
  white: '#FFFFFF',
};

const F = { body: 'body', med: 'med', semi: 'semi', display: 'display' };

type Seg = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

// Aplati les tokens inline de marked en segments de style.
function flatten(tokens: any[] = [], acc: Seg[] = [], st: Partial<Seg> = {}): Seg[] {
  for (const t of tokens) {
    switch (t.type) {
      case 'text':
        if (t.tokens && t.tokens.length) flatten(t.tokens, acc, st);
        else acc.push({ ...st, text: decode(t.text) });
        break;
      case 'strong':
        flatten(t.tokens, acc, { ...st, bold: true });
        break;
      case 'em':
        flatten(t.tokens, acc, { ...st, italic: true });
        break;
      case 'codespan':
        acc.push({ ...st, text: decode(t.text), code: true });
        break;
      case 'link':
        flatten(t.tokens, acc, st);
        break;
      case 'br':
        acc.push({ ...st, text: '\n' });
        break;
      default:
        if (t.tokens) flatten(t.tokens, acc, st);
        else if (t.text) acc.push({ ...st, text: decode(t.text) });
    }
  }
  return acc;
}
function decode(s = ''): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&rsquo;/g, '’')
    // Retours à la ligne "doux" du markdown (source coupée en lignes) -> espace.
    // Les vrais sauts (<br>) passent par un segment '\n' séparé, non concerné ici.
    .replace(/\s*\n\s*/g, ' ');
}
function plain(tokens: any[]): string {
  return flatten(tokens).map((s) => s.text).join('');
}

export interface LessonPdfInput {
  lessonTitle: string;
  courseTitle: string;
  category: string;
  expert?: string;
  markdown: string;
  quiz?: { q: string; options: { t: string; correct?: boolean }[] }[];
  order?: number;
  total?: number;
}

export async function buildLessonPdf(input: LessonPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 54, bottom: 64, left: 54, right: 54 }, bufferPages: true });
  doc.registerFont(F.body, FONTS.body);
  doc.registerFont(F.med, FONTS.med);
  doc.registerFont(F.semi, FONTS.semi);
  doc.registerFont(F.display, FONTS.display);

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  const M = doc.page.margins;
  const left = M.left;
  const contentW = doc.page.width - M.left - M.right;
  const bottom = doc.page.height - M.bottom;

  const ensure = (h: number) => {
    if (doc.y + h > bottom) doc.addPage();
  };

  // ---- Bandeau d'en-tête (page 1) ----
  const bandH = 92;
  doc.rect(0, 0, doc.page.width, bandH).fill(C.ink);
  doc.rect(0, bandH, doc.page.width, 4).fill(C.yellow);
  // Lockup marque
  doc.font(F.display).fontSize(15).fillColor(C.white).text('Tutoria', left, 26, { continued: true });
  doc.fillColor(C.tealL).text(' Academy');
  doc.font(F.semi).fontSize(8).fillColor('#9FC4BC')
    .text(input.category.toUpperCase(), left, 52, { characterSpacing: 1.2 });
  // Pastille domaine à droite
  const badge = 'FICHE LEÇON';
  const cs = 1;
  doc.font(F.semi).fontSize(8);
  const bw = doc.widthOfString(badge) + cs * (badge.length - 1) + 24;
  const bx = doc.page.width - M.right - bw;
  doc.roundedRect(bx, 34, bw, 22, 11).fill(C.teal);
  doc.fillColor(C.white).text(badge, bx, 41, { width: bw, align: 'center', characterSpacing: cs, lineBreak: false });

  // ---- Bloc titre ----
  doc.y = bandH + 26;
  doc.font(F.display).fontSize(24).fillColor(C.ink)
    .text(input.lessonTitle, left, doc.y, { width: contentW, lineGap: 1 });
  doc.moveDown(0.35);
  const meta = [`Cours : ${input.courseTitle}`, input.expert ? `Expert : ${input.expert}` : '', input.order && input.total ? `Leçon ${input.order}/${input.total}` : '']
    .filter(Boolean).join('   ·   ');
  doc.font(F.med).fontSize(9.5).fillColor(C.muted).text(meta, { width: contentW });
  doc.moveDown(0.5);
  doc.moveTo(left, doc.y).lineTo(left + contentW, doc.y).lineWidth(1).strokeColor(C.line).stroke();
  doc.moveDown(0.8);

  // ---- Rendu inline (texte riche), layout mot-à-mot ----
  // On place chaque mot nous-mêmes (mesure + retour à la ligne + saut de page manuels).
  // Ça évite le bug pdfkit où le texte `continued` se chevauche quand la police change
  // au milieu d'une ligne qui se coupe (ce qui garnissait le PDF de texte superposé).
  type RichOpts = { x?: number; y?: number; width?: number; size?: number; color?: string; lineGap?: number; base?: string };
  const richText = (segs: Seg[], opts: RichOpts = {}): number => {
    const x0 = opts.x ?? left;
    const width = opts.width ?? contentW;
    const size0 = opts.size ?? 10.5;
    const colorDef = opts.color ?? C.ink;
    const baseFont = opts.base ?? F.body;
    const lineGap = opts.lineGap ?? 4;
    doc.font(baseFont).fontSize(size0);
    const lineH = doc.currentLineHeight() + lineGap;
    let x = x0;
    let y = opts.y ?? doc.y;
    for (const s of segs) {
      if (s.text === '') continue;
      const font = s.code ? F.med : s.bold ? F.semi : s.italic ? F.med : baseFont;
      const color = s.code ? C.tealD : colorDef;
      const size = s.code ? size0 - 0.5 : size0;
      for (const part of s.text.split(/(\s+)/)) {
        if (part === '') continue;
        if (part.indexOf('\n') !== -1) { x = x0; y += lineH; continue; }
        doc.font(font).fontSize(size);
        if (/^\s+$/.test(part)) { if (x > x0) x += doc.widthOfString(part); continue; }
        const w = doc.widthOfString(part);
        if (x + w > x0 + width && x > x0) { x = x0; y += lineH; }
        if (y + lineH > bottom) { doc.addPage(); y = doc.page.margins.top; x = x0; }
        doc.fillColor(color).text(part, x, y, { lineBreak: false });
        x += w;
      }
    }
    doc.x = x0; doc.y = y + lineH;
    return doc.y;
  };
  const inline = (tokens: any[], opts: RichOpts = {}) => {
    const segs = flatten(tokens).filter((s) => s.text !== '');
    if (segs.length) richText(segs, opts);
  };

  // ---- Tableau ----
  const renderTable = (tok: any) => {
    const cols = tok.header.length;
    const colW = contentW / cols;
    const pad = 7;
    const size = 9.5;
    const measure = (cells: any[]) =>
      Math.max(24, ...cells.map((c: any) => {
        doc.font(F.body).fontSize(size);
        return doc.heightOfString(plain(c.tokens), { width: colW - 2 * pad }) + 2 * pad;
      }));
    const drawRow = (cells: any[], header: boolean, zebra: boolean) => {
      const rowH = measure(cells);
      ensure(rowH);
      const y0 = doc.y;
      // fonds
      if (header) doc.rect(left, y0, contentW, rowH).fill(C.teal);
      else if (zebra) doc.rect(left, y0, contentW, rowH).fill(C.paper);
      // cellules
      cells.forEach((c: any, i: number) => {
        const cx = left + i * colW;
        const segs = flatten(c.tokens).filter((s) => s.text !== '');
        doc.x = cx + pad; doc.y = y0 + pad;
        segs.forEach((s, j) => {
          const last = j === segs.length - 1;
          doc.font(header ? F.semi : s.bold ? F.semi : F.body).fontSize(size)
            .fillColor(header ? C.white : C.ink)
            .text(s.text || ' ', cx + pad, doc.y, { continued: !last, width: colW - 2 * pad, lineGap: 2 });
        });
      });
      // bordures verticales
      doc.lineWidth(0.6).strokeColor(header ? C.teal : C.line);
      for (let i = 1; i < cols; i++) doc.moveTo(left + i * colW, y0).lineTo(left + i * colW, y0 + rowH).stroke();
      doc.rect(left, y0, contentW, rowH).lineWidth(0.6).strokeColor(C.line).stroke();
      doc.y = y0 + rowH;
    };
    drawRow(tok.header, true, false);
    tok.rows.forEach((r: any, i: number) => drawRow(r, false, i % 2 === 1));
    doc.moveDown(0.7);
  };

  // ---- Callout « À retenir » (blockquote) ----
  const renderCallout = (tok: any) => {
    const pad = 13;
    const innerW = contentW - 2 * pad - 6;
    // mesure
    const flat = tok.tokens.flatMap((p: any) => flatten(p.tokens || []));
    doc.font(F.body).fontSize(10);
    const textH = doc.heightOfString(flat.map((s: Seg) => s.text).join(''), { width: innerW });
    const boxH = textH + 2 * pad;
    ensure(boxH + 8);
    const y0 = doc.y;
    doc.roundedRect(left, y0, contentW, boxH, 10).fill(C.tint);
    doc.rect(left, y0, 5, boxH).fill(C.yellow);
    richText(flat.filter((s: Seg) => s.text !== ''), { x: left + pad + 6, y: y0 + pad, width: innerW, size: 10, lineGap: 3 });
    doc.y = y0 + boxH;
    doc.moveDown(0.7);
  };

  // ---- Bloc HTML (ex. <figure><svg>…</figure>) : on n'imprime PAS le markup.
  // On récupère juste la légende <figcaption> pour ne pas perdre le sens de la figure.
  const renderHtml = (tok: any) => {
    const raw: string = tok.raw || tok.text || '';
    const m = raw.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (m) {
      const caption = decode(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
      if (caption) {
        ensure(28);
        doc.moveDown(0.2);
        richText([{ text: caption, italic: true }], { size: 9, color: C.muted });
        doc.moveDown(0.4);
      }
    }
  };

  // ---- Liste ----
  const renderList = (tok: any) => {
    const ordered = tok.ordered;
    tok.items.forEach((it: any, i: number) => {
      const itemTokens = (it.tokens || []).flatMap((t: any) => (t.type === 'text' || t.type === 'paragraph') ? (t.tokens || [{ type: 'text', text: t.text }]) : [t]);
      const segs = flatten(itemTokens).filter((s) => s.text !== '');
      const textX = left + 26;
      const textW = contentW - 26;
      doc.font(F.body).fontSize(10.5);
      const h = Math.max(20, doc.heightOfString(segs.map((s) => s.text).join(''), { width: textW }));
      ensure(h + 4);
      const y0 = doc.y;
      if (ordered) {
        doc.circle(left + 9, y0 + 8, 9).fill(C.teal);
        doc.font(F.semi).fontSize(9).fillColor(C.white).text(String(i + 1), left, y0 + 4, { width: 18, align: 'center' });
      } else {
        doc.circle(left + 6, y0 + 8, 3).fill(C.tealL);
      }
      doc.x = textX; doc.y = y0 + 1;
      segs.forEach((s, j) => {
        const last = j === segs.length - 1;
        doc.font(s.bold ? F.semi : s.code ? F.med : F.body).fontSize(10.5)
          .fillColor(s.code ? C.tealD : C.ink)
          .text(s.text, textX, doc.y, { continued: !last, width: textW, lineGap: 3 });
      });
      doc.y = Math.max(doc.y, y0 + h);
      doc.moveDown(0.25);
    });
    doc.moveDown(0.4);
  };

  // ---- Titres ----
  const heading = (tok: any) => {
    const sizeMap: Record<number, number> = { 1: 18, 2: 14, 3: 12, 4: 11 };
    const size = sizeMap[tok.depth] || 12;
    ensure(size + 16);
    doc.moveDown(0.5);
    const y0 = doc.y;
    if (tok.depth <= 2) {
      doc.rect(left, y0 + 3, 9, 9).fill(C.yellow);
      doc.font(F.display).fontSize(size).fillColor(C.tealD).text(plain(tok.tokens), left + 16, y0, { width: contentW - 16 });
    } else {
      doc.font(F.semi).fontSize(size).fillColor(C.ink).text(plain(tok.tokens), left, y0, { width: contentW });
    }
    doc.moveDown(0.35);
  };

  // ---- Parcours des tokens ----
  const tokens = marked.lexer(input.markdown);
  for (const tok of tokens as any[]) {
    switch (tok.type) {
      case 'heading': heading(tok); break;
      case 'paragraph': inline(tok.tokens); doc.moveDown(0.7); break;
      case 'table': renderTable(tok); break;
      case 'blockquote': renderCallout(tok); break;
      case 'list': renderList(tok); break;
      case 'hr':
        doc.moveDown(0.3);
        doc.moveTo(left, doc.y).lineTo(left + contentW, doc.y).lineWidth(1).strokeColor(C.line).stroke();
        doc.moveDown(0.6); break;
      case 'html': renderHtml(tok); break;
      case 'space': break;
      default:
        // On n'imprime le brut que si ce n'est PAS du HTML (sinon on vidait le markup SVG).
        if (tok.text && tok.type !== 'html') { inline([{ type: 'text', text: tok.text }]); doc.moveDown(0.5); }
    }
  }

  // ---- Quiz ----
  if (input.quiz && input.quiz.length) {
    ensure(60);
    doc.moveDown(0.6);
    doc.rect(left, doc.y + 3, 9, 9).fill(C.yellow);
    doc.font(F.display).fontSize(14).fillColor(C.tealD).text('Vérifie ta compréhension', left + 16, doc.y);
    doc.moveDown(0.6);
    input.quiz.forEach((q, qi) => {
      ensure(24 + q.options.length * 18);
      doc.font(F.semi).fontSize(11).fillColor(C.ink).text(`${qi + 1}. ${q.q}`, left, doc.y, { width: contentW, lineGap: 2 });
      doc.moveDown(0.25);
      q.options.forEach((o) => {
        const y0 = doc.y;
        const cy = y0 + 6;
        if (o.correct) {
          doc.circle(left + 9, cy, 6).fill(C.teal);
          doc.lineWidth(1.4).strokeColor(C.white)
            .moveTo(left + 6.2, cy).lineTo(left + 8.1, cy + 2).lineTo(left + 11.9, cy - 2.4).stroke();
        } else {
          doc.circle(left + 9, cy, 6).lineWidth(1).strokeColor(C.line).stroke();
        }
        doc.font(o.correct ? F.semi : F.body).fontSize(10)
          .fillColor(o.correct ? C.tealD : C.ink)
          .text(o.t, left + 24, y0, { width: contentW - 30, lineGap: 2 });
        doc.y = Math.max(doc.y, y0 + 15);
      });
      doc.moveDown(0.4);
    });
  }

  // ---- Pied de page (toutes les pages) ----
  const range = doc.bufferedPageRange();
  // On dessine dans la zone de marge basse : sans neutraliser la marge, pdfkit ajoute
  // une page à chaque text() (c'est ce qui créait les pages fantômes + le "1/2" décalé).
  doc.page.margins.bottom = 0;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    const fy = doc.page.height - 44;
    doc.moveTo(left, fy).lineTo(left + contentW, fy).lineWidth(0.6).strokeColor(C.line).stroke();
    doc.font(F.semi).fontSize(8).fillColor(C.teal).text('Tutoria Academy', left, fy + 8, { lineBreak: false });
    doc.font(F.body).fontSize(8).fillColor(C.muted)
      .text('tutoria.news · Apprends, comprends, applique', left, fy + 8, { width: contentW, align: 'center', lineBreak: false });
    doc.font(F.med).fontSize(8).fillColor(C.muted)
      .text(`${i + 1} / ${range.count}`, left, fy + 8, { width: contentW, align: 'right', lineBreak: false });
  }

  doc.end();
  return done;
}
