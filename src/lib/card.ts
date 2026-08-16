// Fabrique une carte-image à la charte Tutoria : photo Pexels + voile teal +
// kicker jaune + titre blanc + barre jaune. Retourne un buffer WebP 1000x1000.
import sharp from 'sharp';
import { POPPINS_B64 } from './poppins';

export function getPexelsKey(): string | undefined {
  return process.env.PEXELS_API_KEY || import.meta.env.PEXELS_API_KEY;
}

async function pexelsPhoto(key: string, query: string): Promise<Buffer | null> {
  try {
    const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=5&orientation=square', { headers: { Authorization: key } });
    if (!r.ok) return null;
    const j = await r.json();
    const p = j.photos && j.photos[0];
    if (!p) return null;
    const src = p.src?.large2x || p.src?.large || p.src?.original;
    const img = await fetch(src);
    if (!img.ok) return null;
    return Buffer.from(await img.arrayBuffer());
  } catch { return null; }
}

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

// Compose la carte. imageQuery pilote la photo ; kicker + cardTitle l'habillage.
export async function makeCard(pexelsKey: string, kicker: string, cardTitle: string, imageQuery: string): Promise<Buffer | null> {
  const photo = await pexelsPhoto(pexelsKey, imageQuery || cardTitle);
  if (!photo) return null;
  const hasKicker = !!(kicker && kicker.trim());
  const lines = titleLines(cardTitle);
  const two = lines.length > 1;
  const tSize = two ? 72 : 84;
  // Sans kicker, on descend un peu le titre pour garder le bloc équilibré.
  const kickerY = two ? 762 : 800;
  const titleY = two ? [846, 846 + tSize + 14] : [hasKicker ? 888 : 872];
  const kickerSvg = hasKicker ? `<text x="500" y="${kickerY}" text-anchor="middle" class="k">${esc(kicker)}</text>` : '';
  const titleSvg = lines.map((ln, i) => `<text x="500" y="${titleY[i]}" text-anchor="middle" class="t">${esc(ln)}</text>`).join('');
  const svg = `<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg"><defs><style>@font-face{font-family:'P';src:url(data:font/ttf;base64,${POPPINS_B64}) format('truetype');font-weight:800;} .k{font-family:'P';font-weight:800;font-size:34px;fill:#FDD200;letter-spacing:7px;} .t{font-family:'P';font-weight:800;font-size:${tSize}px;fill:#ffffff;}</style><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E8074" stop-opacity="0.06"/><stop offset="0.45" stop-color="#0E8074" stop-opacity="0.26"/><stop offset="1" stop-color="#0E8074" stop-opacity="0.94"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#g)"/>${kickerSvg}${titleSvg}<rect x="0" y="976" width="1000" height="24" fill="#FDD200"/></svg>`;
  try {
    return await sharp(photo).resize(1000, 1000, { fit: 'cover', position: 'attention' }).composite([{ input: Buffer.from(svg) }]).webp({ quality: 86 }).toBuffer();
  } catch { return null; }
}
