import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';

export const prerender = false;

function getRedis(): Redis | null {
  const url = import.meta.env.KV_REST_API_URL || process.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const keyOf = (pid: string) => `comments:${pid}`;

// Liste publique : uniquement les commentaires approuvés
export const GET: APIRoute = async ({ url }) => {
  const pid = url.searchParams.get('pageId');
  const redis = getRedis();
  if (!pid || !redis) return json({ comments: [] });
  const all: any[] = (await redis.get(keyOf(pid))) || [];
  const pub = all.filter((c) => c.approved).map((c) => ({ name: c.name, text: c.text, date: c.date }));
  return json({ comments: pub });
};

// Dépôt d'un commentaire -> en attente de modération
export const POST: APIRoute = async ({ request }) => {
  const redis = getRedis();
  if (!redis) return json({ ok: false, error: 'config' }, 500);
  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid' }, 400); }
  if ((body.website || '').toString().trim()) return json({ ok: true }); // honeypot : on ignore les bots
  const pid = (body.pageId || '').toString().slice(0, 300);
  const name = (body.name || '').toString().trim().slice(0, 60);
  const text = (body.text || '').toString().trim().slice(0, 2000);
  if (!pid || name.length < 2 || text.length < 2) return json({ ok: false, error: 'champs' }, 400);

  const k = keyOf(pid);
  const all: any[] = (await redis.get(k)) || [];
  const c = { id: randomUUID(), name, text, date: new Date().toISOString(), approved: false };
  all.push(c);
  await redis.set(k, all);

  const pend: any[] = (await redis.get('mod:pending')) || [];
  pend.push({ pageId: pid, id: c.id, name, text, date: c.date });
  await redis.set('mod:pending', pend);

  return json({ ok: true, pending: true });
};
