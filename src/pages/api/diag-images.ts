import type { APIRoute } from 'astro';
import { makeCard, getPexelsKey } from '../../lib/card';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;

// Diagnostic protégé : GET /api/diag-images?secret=XXX
//   -> JSON : la clé Pexels est-elle vue ? Pexels répond-il ? sharp compose-t-il ?
// Avec &img=1 : renvoie directement une carte composée par la fonction (preuve visuelle).
export const GET: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret') || '';
  if (!ADMIN() || secret !== ADMIN()) return new Response('unauthorized', { status: 401 });

  const key = getPexelsKey();
  const wantImg = url.searchParams.get('img') === '1';

  const report: any = { pexelsKeyPresent: !!key, pexelsKeyLen: key ? key.length : 0 };

  // 1) sharp se charge-t-il du tout ?
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#0E8074' } }).png().toBuffer();
    report.sharpLoads = png.length > 0;
  } catch (e: any) { report.sharpLoads = false; report.sharpError = (e?.message || String(e)).slice(0, 200); }

  // 2) Pexels répond-il ?
  if (key) {
    try {
      const r = await fetch('https://api.pexels.com/v1/search?query=money&per_page=1&orientation=square', { headers: { Authorization: key } });
      report.pexelsStatus = r.status;
      const j = await r.json().catch(() => ({}));
      report.pexelsPhotos = Array.isArray(j.photos) ? j.photos.length : 0;
    } catch (e: any) { report.pexelsError = (e?.message || String(e)).slice(0, 200); }
  }

  // 3) composition complète d'une carte (Pexels + sharp + police)
  if (key) {
    try {
      const buf = await makeCard(key, 'ÉTAPE 1', 'Test de composition', 'african business phone');
      report.cardComposed = !!buf;
      report.cardBytes = buf ? buf.length : 0;
      if (wantImg && buf) return new Response(new Uint8Array(buf), { status: 200, headers: { 'content-type': 'image/webp' } });
    } catch (e: any) { report.cardComposed = false; report.cardError = (e?.message || String(e)).slice(0, 200); }
  }

  return new Response(JSON.stringify(report, null, 2), { status: 200, headers: { 'content-type': 'application/json' } });
};
