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

// Couverture 1200x1000 SANS texte, style de référence : deux zones teal séparées par une COURBE
// (liseré vert), vignette ronde N&B nette, pictogramme Tutoria en cercle blanc. Pas de barre jaune.
export async function composeCover(photo: Buffer): Promise<Buffer | null> {
  const W = 1200, H = 1000, D = 380, CX = 560, CY = 520;
  const CURVE = 'M 690 0 C 560 340, 780 660, 600 1000';
  const LEFT = 'M0 0 L 690 0 C 560 340 780 660 600 1000 L 0 1000 Z';
  const RIGHT = 'M 690 0 L 1200 0 L 1200 1000 L 600 1000 C 780 660 560 340 690 0 Z';
  try {
    // base N&B contrastée, puis voile teal fort (multiply) : droite teal profond, gauche teal moyen
    const gray = await sharp(photo).resize(W, H, { fit: 'cover', position: 'attention' }).grayscale().normalise().toColourspace('srgb').toBuffer();
    const rightVeil = Buffer.from(`<svg width="${W}" height="${H}"><path d="${RIGHT}" fill="#0B4A44" fill-opacity="0.62"/></svg>`);
    const leftVeil = Buffer.from(`<svg width="${W}" height="${H}"><path d="${LEFT}" fill="#12897B" fill-opacity="0.6"/></svg>`);
    const img = await sharp(gray).composite([{ input: rightVeil, blend: 'multiply' }, { input: leftVeil, blend: 'multiply' }]).toBuffer();
    const g2 = await sharp(photo).resize(D, D, { fit: 'cover', position: 'attention' }).grayscale().normalise().toBuffer();
    const cmask = Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="#fff"/></svg>`);
    const inset = await sharp(g2).composite([{ input: cmask, blend: 'dest-in' }]).png().toBuffer();
    const strokes = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><path d="${CURVE}" fill="none" stroke="#A7E6C6" stroke-width="6"/><circle cx="${CX}" cy="${CY}" r="${D / 2 + 9}" fill="none" stroke="#0E8074" stroke-width="11"/><circle cx="${CX}" cy="${CY}" r="${D / 2 + 17}" fill="none" stroke="#A7E6C6" stroke-width="3"/></svg>`;
    const pic = await sharp(Buffer.from(PICTO_B64, 'base64')).resize(128, 128).toBuffer();
    const badge = await sharp(Buffer.from(`<svg width="180" height="180"><circle cx="90" cy="90" r="82" fill="#fff"/></svg>`)).composite([{ input: pic, left: 26, top: 26 }]).png().toBuffer();
    return await sharp(img).composite([
      { input: inset, left: CX - D / 2, top: CY - D / 2 },
      { input: Buffer.from(strokes) },
      { input: badge, left: W - 210, top: 44 },
    ]).webp({ quality: 88 }).toBuffer();
  } catch { return null; }
}

// Compat : compose une carte en récupérant elle-même sa photo (sans anti-doublon).
export async function makeCard(pexelsKey: string, kicker: string, cardTitle: string, imageQuery: string): Promise<Buffer | null> {
  const p = await fetchPhoto(pexelsKey, imageQuery || cardTitle, 'square', new Set());
  if (!p) return null;
  return composeCard(p.buf, kicker, cardTitle);
}
