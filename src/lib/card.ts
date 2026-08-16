// Fabrique les visuels des articles à la charte Tutoria :
//  - composeCard  : carte de section (photo + voile teal + pastille jaune + titre + barre)
//  - composeCover : couverture d'aperçu (paysage, bicolore, vignette ronde, pictogramme, SANS texte)
//  - fetchPhoto   : récupère une photo Pexels en évitant les doublons (par id)
import sharp from 'sharp';
import { FREDOKA_B64 } from './fredoka';
import { PICTO_B64 } from './picto';

export function getPexelsKey(): string | undefined {
  return process.env.PEXELS_API_KEY || import.meta.env.PEXELS_API_KEY;
}

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  let kickerSvg = '';
  if (hasKicker) {
    const kSize = 30;
    let w = 0; for (const ch of kick) w += ch === ' ' ? kSize * 0.34 : kSize * 0.64;
    const bw = Math.round(w + 56), bx = Math.round(500 - bw / 2), by = kickerBase - 35;
    kickerSvg = `<rect x="${bx}" y="${by}" width="${bw}" height="52" rx="26" fill="#FDD200"/><text x="500" y="${kickerBase}" text-anchor="middle" class="k">${esc(kick)}</text>`;
  }
  const titleSvg = lines.map((ln, i) => `<text x="500" y="${titleY[i]}" text-anchor="middle" class="t">${esc(ln)}</text>`).join('');
  // NB: font-weight:800 obligatoire dans @font-face ET les classes, sinon resvg ignore la police embarquée.
  const svg = `<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg"><defs><style>@font-face{font-family:'F';src:url(data:font/ttf;base64,${FREDOKA_B64}) format('truetype');font-weight:800;} .k{font-family:'F';font-weight:800;font-size:30px;fill:#0B4A44;} .t{font-family:'F';font-weight:800;font-size:${tSize}px;fill:#ffffff;}</style><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E8074" stop-opacity="0.06"/><stop offset="0.45" stop-color="#0E8074" stop-opacity="0.26"/><stop offset="1" stop-color="#0E8074" stop-opacity="0.94"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#g)"/>${kickerSvg}${titleSvg}<rect x="0" y="976" width="1000" height="24" fill="#FDD200"/></svg>`;
  try {
    return await sharp(photo).resize(1000, 1000, { fit: 'cover', position: 'attention' }).composite([{ input: Buffer.from(svg) }]).webp({ quality: 86 }).toBuffer();
  } catch { return null; }
}

// Couverture 1200x800 SANS texte : panneau teal courbe + photo, vignette ronde N&B (anneau teal+jaune),
// pictogramme Tutoria en cercle blanc, barre jaune. Reprend le style de la couverture de référence.
export async function composeCover(photo: Buffer): Promise<Buffer | null> {
  const W = 1200, H = 800, D = 360, CX = 470, CY = 400;
  try {
    const base = await sharp(photo).resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
    const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>
      <linearGradient id="bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0.4" stop-color="#0B4A44" stop-opacity="0"/><stop offset="1" stop-color="#0B4A44" stop-opacity="0.92"/></linearGradient>
      <linearGradient id="lft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E8074" stop-opacity="0.92"/><stop offset="1" stop-color="#0E8074" stop-opacity="0.30"/></linearGradient>
      </defs><path d="M0 0 L560 0 C480 260 640 520 520 800 L0 800 Z" fill="url(#lft)"/><rect width="${W}" height="${H}" fill="url(#bot)"/></svg>`;
    const gray = await sharp(photo).resize(D, D, { fit: 'cover', position: 'attention' }).grayscale().toBuffer();
    const mask = Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="#fff"/></svg>`);
    const inset = await sharp(gray).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    const ring = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><circle cx="${CX}" cy="${CY}" r="${D / 2 + 8}" fill="none" stroke="#0E8074" stroke-width="10"/><path d="M ${CX} ${CY - (D / 2 + 8)} A ${D / 2 + 8} ${D / 2 + 8} 0 0 1 ${CX + (D / 2 + 8)} ${CY}" fill="none" stroke="#FDD200" stroke-width="10" stroke-linecap="round"/></svg>`;
    const pic = await sharp(Buffer.from(PICTO_B64, 'base64')).resize(128, 128).toBuffer();
    const badge = await sharp(Buffer.from(`<svg width="180" height="180"><circle cx="90" cy="90" r="82" fill="#fff"/></svg>`)).composite([{ input: pic, left: 26, top: 26 }]).png().toBuffer();
    const bar = `<svg width="${W}" height="${H}"><rect x="0" y="${H - 18}" width="${W}" height="18" fill="#FDD200"/></svg>`;
    return await sharp(base).composite([
      { input: Buffer.from(overlay) },
      { input: inset, left: CX - D / 2, top: CY - D / 2 },
      { input: Buffer.from(ring) },
      { input: badge, left: W - 210, top: 40 },
      { input: Buffer.from(bar) },
    ]).webp({ quality: 88 }).toBuffer();
  } catch { return null; }
}

// Compat : compose une carte en récupérant elle-même sa photo (sans anti-doublon).
export async function makeCard(pexelsKey: string, kicker: string, cardTitle: string, imageQuery: string): Promise<Buffer | null> {
  const p = await fetchPhoto(pexelsKey, imageQuery || cardTitle, 'square', new Set());
  if (!p) return null;
  return composeCard(p.buf, kicker, cardTitle);
}
