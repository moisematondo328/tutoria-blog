import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getBrevoKey, createAndSendCampaign, articleEmailHtml, SITE_URL, BREVO_LIST_ID } from '../../lib/brevo';
import { getJSON, setJSON } from '../../lib/store';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

const SENT_KEY = 'broadcast:sent';     // slugs réellement envoyés (badge UI)
const KNOWN_KEY = 'broadcast:known';   // slugs déjà pris en compte (jamais auto-diffusés)
const AUTO_KEY = 'broadcast:auto';     // interrupteur diffusion automatique

export async function listArticles() {
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

async function subscriberCount(apiKey?: string): Promise<number | null> {
  if (!apiKey) return null;
  try {
    const r = await fetch(`https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}`, { headers: { 'api-key': apiKey, accept: 'application/json' } });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d.totalSubscribers === 'number' ? d.totalSubscribers : null;
  } catch { return null; }
}

// Envoie un article à la liste + marque comme envoyé/connu.
export async function broadcastOne(apiKey: string, a: { slug: string; title: string; excerpt: string; cover: string; url: string }) {
  const r = await createAndSendCampaign({ apiKey, name: `Article - ${a.title}`.slice(0, 120), subject: a.title, htmlContent: articleEmailHtml(a) });
  if (!r.ok) return r;
  const sent: string[] = (await getJSON(SENT_KEY)) || [];
  const known: string[] = (await getJSON(KNOWN_KEY)) || [];
  if (!sent.includes(a.slug)) { sent.push(a.slug); await setJSON(SENT_KEY, sent); }
  if (!known.includes(a.slug)) { known.push(a.slug); await setJSON(KNOWN_KEY, known); }
  return r;
}

// État : articles + abonnés + interrupteur auto
export const GET: APIRoute = async ({ url }) => {
  if (!ADMIN() || url.searchParams.get('secret') !== ADMIN()) return json({ ok: false }, 401);
  const sent: string[] = (await getJSON(SENT_KEY)) || [];
  const auto = (await getJSON(AUTO_KEY)) === true;
  const list = (await listArticles()).map((a) => ({ ...a, sent: sent.includes(a.slug) }));
  const subscribers = await subscriberCount(getBrevoKey());
  return json({ ok: true, articles: list, subscribers, auto });
};

// POST : { action:'setAuto', value } OU { slug } pour envoyer un article
export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);

  if (b.action === 'setAuto') {
    const value = !!b.value;
    if (value) {
      // baseline : on considère tous les articles actuels comme "connus" (pas de blast rétroactif)
      const slugs = (await listArticles()).map((a) => a.slug);
      const known: string[] = (await getJSON(KNOWN_KEY)) || [];
      const merged = Array.from(new Set([...known, ...slugs]));
      await setJSON(KNOWN_KEY, merged);
    }
    await setJSON(AUTO_KEY, value);
    return json({ ok: true, auto: value });
  }

  const apiKey = getBrevoKey();
  if (!apiKey) return json({ ok: false, error: 'config' }, 500);
  const a = (await listArticles()).find((x) => x.slug === b.slug);
  if (!a) return json({ ok: false, error: 'introuvable' }, 404);
  const r = await broadcastOne(apiKey, a);
  if (!r.ok) return json({ ok: false, error: r.error || 'brevo' }, 502);
  return json({ ok: true });
};
