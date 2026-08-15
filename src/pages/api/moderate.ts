import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

function getRedis(): Redis | null {
  const url = import.meta.env.KV_REST_API_URL || process.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
const ADMIN = () => import.meta.env.ADMIN_SECRET || process.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Liste des commentaires EN ATTENTE (réservé au modérateur)
export const GET: APIRoute = async ({ url }) => {
  if (!ADMIN() || url.searchParams.get('secret') !== ADMIN()) return json({ ok: false }, 401);
  const redis = getRedis();
  if (!redis) return json({ ok: false, error: 'config' }, 500);
  const pend: any[] = (await redis.get('mod:pending')) || [];
  return json({ ok: true, pending: pend.sort((a, b) => (a.date < b.date ? 1 : -1)) });
};

// Approuver ou supprimer un commentaire
export const POST: APIRoute = async ({ request }) => {
  const redis = getRedis();
  if (!redis) return json({ ok: false, error: 'config' }, 500);
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const { action, pageId, id } = b;
  if (!pageId || !id || !['approve', 'delete'].includes(action)) return json({ ok: false }, 400);

  const k = `comments:${pageId}`;
  let all: any[] = (await redis.get(k)) || [];
  let pend: any[] = (await redis.get('mod:pending')) || [];
  if (action === 'approve') all = all.map((c) => (c.id === id ? { ...c, approved: true } : c));
  else all = all.filter((c) => c.id !== id);
  pend = pend.filter((p) => !(p.pageId === pageId && p.id === id));
  await redis.set(k, all);
  await redis.set('mod:pending', pend);
  return json({ ok: true });
};
