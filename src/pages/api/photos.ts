import type { APIRoute } from 'astro';
import { getPexelsKey, getPixabayKey, searchPexels, searchPixabay, type PhotoCand } from '../../lib/card';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// POST { secret, query, orientation? } -> candidats photo (Pexels + Pixabay) pour l'aperçu /admin.
export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const query = (b.query || '').toString().trim();
  if (query.length < 2) return json({ ok: false, error: 'query' }, 400);
  const orientation = b.orientation === 'landscape' ? 'landscape' : 'square';

  const pexKey = getPexelsKey(), pixKey = getPixabayKey();
  if (!pexKey && !pixKey) return json({ ok: false, error: 'config' }, 500);

  const [pex, pix] = await Promise.all([
    pexKey ? searchPexels(pexKey, query, orientation) : Promise.resolve([] as PhotoCand[]),
    pixKey ? searchPixabay(pixKey, query, orientation) : Promise.resolve([] as PhotoCand[]),
  ]);

  // Entrelacer les deux sources pour un mélange équilibré.
  const photos: PhotoCand[] = [];
  for (let i = 0; i < Math.max(pex.length, pix.length); i++) {
    if (pex[i]) photos.push(pex[i]);
    if (pix[i]) photos.push(pix[i]);
  }
  return json({ ok: true, photos: photos.slice(0, 20) });
};
