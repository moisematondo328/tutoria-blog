import type { APIRoute } from 'astro';
import { getJSON, setJSON, hasStore } from '../../lib/store';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Liste des commentaires EN ATTENTE (réservé au modérateur)
export const GET: APIRoute = async ({ url }) => {
  if (!ADMIN() || url.searchParams.get('secret') !== ADMIN()) return json({ ok: false }, 401);
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  const pend: any[] = (await getJSON('mod:pending')) || [];
  return json({ ok: true, pending: pend.sort((a, b) => (a.date < b.date ? 1 : -1)) });
};

// Approuver ou supprimer un commentaire
export const POST: APIRoute = async ({ request }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const { action, pageId, id } = b;
  if (!pageId || !id || !['approve', 'delete'].includes(action)) return json({ ok: false }, 400);

  const k = `comments:${pageId}`;
  let all: any[] = (await getJSON(k)) || [];
  let pend: any[] = (await getJSON('mod:pending')) || [];
  if (action === 'approve') all = all.map((c) => (c.id === id ? { ...c, approved: true } : c));
  else all = all.filter((c) => c.id !== id);
  pend = pend.filter((p) => !(p.pageId === pageId && p.id === id));
  await setJSON(k, all);
  await setJSON('mod:pending', pend);
  return json({ ok: true });
};
