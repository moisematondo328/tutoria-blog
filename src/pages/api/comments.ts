import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { getJSON, setJSON, hasStore } from '../../lib/store';

export const prerender = false;

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const keyOf = (pid: string) => `comments:${pid}`;

// Liste publique : uniquement les commentaires approuvés
export const GET: APIRoute = async ({ url }) => {
  const pid = url.searchParams.get('pageId');
  if (!pid || !hasStore()) return json({ comments: [] });
  const all: any[] = (await getJSON(keyOf(pid))) || [];
  const pub = all.filter((c) => c.approved).map((c) => ({ name: c.name, text: c.text, date: c.date }));
  return json({ comments: pub });
};

// Dépôt d'un commentaire -> en attente de modération
export const POST: APIRoute = async ({ request }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid' }, 400); }
  if ((body.website || '').toString().trim()) return json({ ok: true }); // honeypot : on ignore les bots
  const pid = (body.pageId || '').toString().slice(0, 300);
  const name = (body.name || '').toString().trim().slice(0, 60);
  const text = (body.text || '').toString().trim().slice(0, 2000);
  if (!pid || name.length < 2 || text.length < 2) return json({ ok: false, error: 'champs' }, 400);

  const k = keyOf(pid);
  const all: any[] = (await getJSON(k)) || [];
  const c = { id: randomUUID(), name, text, date: new Date().toISOString(), approved: false };
  all.push(c);
  await setJSON(k, all);

  const pend: any[] = (await getJSON('mod:pending')) || [];
  pend.push({ pageId: pid, id: c.id, name, text, date: c.date });
  await setJSON('mod:pending', pend);

  return json({ ok: true, pending: true });
};
