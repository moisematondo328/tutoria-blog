import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getBrevoKey, createAndSendCampaign, articleEmailHtml, SITE_URL } from '../../lib/brevo';
import { getJSON, setJSON } from '../../lib/store';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const SENT_KEY = 'broadcast:sent';

async function articles() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts
    .map((p) => ({
      slug: p.id,
      title: p.data.title,
      excerpt: p.data.excerpt || '',
      cover: p.data.cover || '',
      date: p.data.date,
      url: `${SITE_URL}/blog/${p.id}/`,
    }))
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
}

// Liste des articles + statut « déjà diffusé »
export const GET: APIRoute = async ({ url }) => {
  if (!ADMIN() || url.searchParams.get('secret') !== ADMIN()) return json({ ok: false }, 401);
  const sent: string[] = (await getJSON(SENT_KEY)) || [];
  const list = (await articles()).map((a) => ({ ...a, sent: sent.includes(a.slug) }));
  return json({ ok: true, articles: list });
};

// Envoie un article à toute la liste d'abonnés
export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const apiKey = getBrevoKey();
  if (!apiKey) return json({ ok: false, error: 'config' }, 500);

  const a = (await articles()).find((x) => x.slug === b.slug);
  if (!a) return json({ ok: false, error: 'introuvable' }, 404);

  const r = await createAndSendCampaign({
    apiKey,
    name: `Article - ${a.title}`.slice(0, 120),
    subject: a.title,
    htmlContent: articleEmailHtml(a),
  });
  if (!r.ok) return json({ ok: false, error: r.error || 'brevo' }, 502);

  const sent: string[] = (await getJSON(SENT_KEY)) || [];
  if (!sent.includes(a.slug)) { sent.push(a.slug); await setJSON(SENT_KEY, sent); }
  return json({ ok: true });
};
