// Fabrique les visuels des articles à la charte Tutoria :
//  - composeCard  : carte de section (photo + voile teal + pastille jaune + titre + barre)
//  - composeCover : couverture d'aperçu (paysage, bicolore, vignette ronde, pictogramme, SANS texte)
//  - fetchPhoto   : récupère une photo Pexels en évitant les doublons (par id)
import sharp from 'sharp';
import opentype from 'opentype.js';
import { PICTO_B64 } from './picto';
import { PLAYFAIR_B64 } from './playfair';

// Police des TITRES = Playfair Display 900 Italic (comme la signature du logo). Rendue en
// tracés SVG via opentype.js (resvg ne la charge pas en @font-face).
let TITLE_FONT: any = null;
try { const _b = Buffer.from(PLAYFAIR_B64, 'base64'); TITLE_FONT = opentype.parse(_b.buffer.slice(_b.byteOffset, _b.byteOffset + _b.byteLength)); } catch { TITLE_FONT = null; }
// Sérialisation manuelle du chemin, nombres séparés par des espaces + coordonnées ENTIÈRES.
// (toPathData d'opentype colle les nombres et resvg les parse mal → glyphes cassés/points parasites.)
function pathCmds(cmds: any[]): string {
  const r = (n: number) => Math.round(n);
  let d = '';
  for (const c of cmds) {
    if (c.type === 'M') d += `M ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') d += `L ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'C') d += `C ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') d += `Q ${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Z') d += 'Z ';
  }
  return d.trim();
}
function titlePaths(text: string, size: number, cx: number, baseline: number, fill = '#ffffff'): string {
  if (!TITLE_FONT) return '';
  const s = size / TITLE_FONT.unitsPerEm;
  let w = 0; for (const ch of text) w += TITLE_FONT.charToGlyph(ch).advanceWidth * s;
  let x = cx - w / 2, out = '';
  for (const ch of text) {
    const g = TITLE_FONT.charToGlyph(ch);
    const d = pathCmds(g.getPath(x, baseline, size).commands);
    if (d.length > 2) out += `<path d="${d}" fill="${fill}"/>`;
    x += g.advanceWidth * s;
  }
  return out;
}

function measureText(text: string, size: number): number {
  if (!TITLE_FONT) return text.length * size * 0.5;
  const s = size / TITLE_FONT.unitsPerEm;
  let w = 0; for (const ch of text) w += TITLE_FONT.charToGlyph(ch).advanceWidth * s;
  return w;
}

export function getPexelsKey(): string | undefined {
  return process.env.PEXELS_API_KEY || import.meta.env.PEXELS_API_KEY;
}

// Récupère une photo pertinente en sautant les id déjà utilisés (anti-doublon).
export async function fetchPhoto(key: string, query: string, orientation: 'square' | 'landscape', exclude: Set<number>): Promise<{ buf: Buffer; id: number } | null> {
  try {
    const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=12&orientation=' + orientation, { headers: { Authorization: key } });
    if (!r.ok) return null;
    const j = await r.json();
    const photos: any[] = Array.isArray(j.photos) ? j.photos : [];
    const pick = photos.find((p) => !exclude.has(p.id)) || photos[0];
    if (!pick) return null;
    const src = orientation === 'landscape' ? (pick.src?.large2x || pick.src?.landscape || pick.src?.large) : (pick.src?.large2x || pick.src?.large || pick.src?.original);
    const img = await fetch(src);
    if (!img.ok) return null;
    return { buf: Buffer.from(await img.arrayBuffer()), id: pick.id };
  } catch { return null; }
}

// Récupère une photo Pexels précise par son id (choix manuel depuis /admin).
export async function fetchPhotoById(key: string, id: number | string): Promise<{ buf: Buffer; id: number } | null> {
  try {
    const r = await fetch('https://api.pexels.com/v1/photos/' + id, { headers: { Authorization: key } });
    if (!r.ok) return null;
    const p = await r.json();
    const src = p.src?.large2x || p.src?.large || p.src?.landscape || p.src?.original;
    if (!src) return null;
    const img = await fetch(src);
    if (!img.ok) return null;
    return { buf: Buffer.from(await img.arrayBuffer()), id: p.id };
  } catch { return null; }
}

function titleLines(title: string): string[] {
  const t = title.trim();
  if (t.length <= 17) return [t];
  const words = t.split(/\s+/);
  const half = Math.ceil(t.length / 2);
  let l1 = '';
  const rest: string[] = [];
  for (const w of words) {
    if (!rest.length && (l1 ? l1.length + 1 + w.length : w.length) <= half) l1 = l1 ? l1 + ' ' + w : w;
    else rest.push(w);
  }
  return rest.length ? [l1, rest.join(' ')] : [l1];
}

// Carte de section 1000x1000 : photo + voile teal + pastille jaune (libellé) + titre blanc + barre jaune.
export async function composeCard(photo: Buffer, kicker: string, cardTitle: string): Promise<Buffer | null> {
  const hasKicker = !!(kicker && kicker.trim());
  const kick = hasKicker ? kicker.trim() : '';
  const lines = titleLines(cardTitle);
  const two = lines.length > 1;
  const tSize = two ? 72 : 84;
  const kickerBase = two ? 760 : 800;
  const titleY = two ? [846, 846 + tSize + 14] : [hasKicker ? 890 : 872];
  // Titre ET libellé en tracés Playfair (serif italique). Libellé = texte teal foncé sur pastille jaune.
  let kickerSvg = '';
  if (hasKicker) {
    const kSize = 30;
    const bw = Math.round(measureText(kick, kSize) + 56), bx = Math.round(500 - bw / 2), by = kickerBase - 35;
    kickerSvg = `<rect x="${bx}" y="${by}" width="${bw}" height="52" rx="26" fill="#FDD200"/>` + titlePaths(kick, kSize, 500, kickerBase, '#0B4A44');
  }
  const titleSvg = lines.map((ln, i) => titlePaths(ln, tSize, 500, titleY[i])).join('');
  const svg = `<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E8074" stop-opacity="0.06"/><stop offset="0.45" stop-color="#0E8074" stop-opacity="0.26"/><stop offset="1" stop-color="#0E8074" stop-opacity="0.94"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#g)"/>${kickerSvg}${titleSvg}<rect x="0" y="976" width="1000" height="24" fill="#FDD200"/></svg>`;
  try {
    return await sharp(photo).resize(1000, 1000, { fit: 'cover', position: 'attention' }).composite([{ input: Buffer.from(svg) }]).webp({ quality: 86 }).toBuffer();
  } catch { return null; }
}

// Récupère la photo la PLUS LUMINEUSE parmi plusieurs candidats (une couverture sombre rend mal).
export async function fetchBrightPhoto(key: string, query: string, exclude: Set<number>): Promise<{ buf: Buffer; id: number } | null> {
  try {
    const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=10&orientation=landscape', { headers: { Authorization: key } });
    if (!r.ok) return null;
    const j = await r.json();
    const cand: any[] = (Array.isArray(j.photos) ? j.photos : []).filter((p: any) => !exclude.has(p.id)).slice(0, 6);
    if (!cand.length) return null;
    let best: any = null, bestL = -1;
    for (const p of cand) {
      try {
        const im = await fetch(p.src?.small || p.src?.medium); // petite image pour évaluer vite
        if (!im.ok) continue;
        const st = await sharp(Buffer.from(await im.arrayBuffer())).stats();
        const L = (st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3;
        if (L > bestL) { bestL = L; best = p; }
      } catch { /* ignore ce candidat */ }
    }
    if (!best) best = cand[0];
    const full = await fetch(best.src?.large2x || best.src?.landscape || best.src?.large);
    if (!full.ok) return null;
    return { buf: Buffer.from(await full.arrayBuffer()), id: best.id };
  } catch { return null; }
}

// Couverture 1200x800 SANS texte, style "split marque" : panneau teal à gauche (pictogramme
// Tutoria) + couture jaune + photo couleur à droite. Robuste (indépendant de la luminosité).
export async function composeCover(photo: Buffer): Promise<Buffer | null> {
  const W = 1200, H = 800, SPLIT = Math.round(W * 0.4), BS = 220;
  try {
    const rightPhoto = await sharp(photo).resize(W - SPLIT, H, { fit: 'cover', position: 'attention' }).toBuffer();
    const pic = await sharp(Buffer.from(PICTO_B64, 'base64')).resize(Math.round(BS * 0.72), Math.round(BS * 0.72)).toBuffer();
    const badge = await sharp(Buffer.from(`<svg width="${BS}" height="${BS}"><circle cx="${BS / 2}" cy="${BS / 2}" r="${BS / 2 - 2}" fill="#fff"/></svg>`))
      .composite([{ input: pic, left: Math.round(BS * 0.14), top: Math.round(BS * 0.14) }]).png().toBuffer();
    const seam = Buffer.from(`<svg width="10" height="${H}"><rect width="10" height="${H}" fill="#FDD200"/></svg>`);
    return await sharp({ create: { width: W, height: H, channels: 3, background: '#0E8074' } })
      .composite([
        { input: rightPhoto, left: SPLIT, top: 0 },
        { input: seam, left: SPLIT - 5, top: 0 },
        { input: badge, left: Math.round(SPLIT / 2 - BS / 2), top: Math.round(H / 2 - BS / 2) },
      ]).webp({ quality: 90 }).toBuffer();
  } catch { return null; }
}

// Compat : compose une carte en récupérant elle-même sa photo (sans anti-doublon).
export async function makeCard(pexelsKey: string, kicker: string, cardTitle: string, imageQuery: string): Promise<Buffer | null> {
  const p = await fetchPhoto(pexelsKey, imageQuery || cardTitle, 'square', new Set());
  if (!p) return null;
  return composeCard(p.buf, kicker, cardTitle);
}
