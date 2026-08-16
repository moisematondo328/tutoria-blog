import type { APIRoute } from 'astro';
import { getPexelsKey } from '../../lib/card';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// POST { secret, query, orientation? } -> candidats photo pour l'aperçu /admin.
export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const key = getPexelsKey();
  if (!key) return json({ ok: false, error: 'config' }, 500);
  const query = (b.query || '').toString().trim();
  if (query.length < 2) return json({ ok: false, error: 'query' }, 400);
  const orientation = b.orientation === 'landscape' ? 'landscape' : 'square';
  try {
    const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=12&orientation=' + orientation, { headers: { Authorization: key } });
    if (!r.ok) return json({ ok: false, error: 'pexels', status: r.status }, 502);
    const j = await r.json();
    const photos = (Array.isArray(j.photos) ? j.photos : []).map((p: any) => ({
      id: p.id,
      thumb: p.src?.medium || p.src?.small || p.src?.tiny,
      alt: (p.alt || '').toString().slice(0, 80),
    }));
    return json({ ok: true, photos });
  } catch (e: any) { return json({ ok: false, error: 'reseau' }, 502); }
};
