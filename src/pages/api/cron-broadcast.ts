import type { APIRoute } from 'astro';
import { getBrevoKey } from '../../lib/brevo';
import { getJSON } from '../../lib/store';
import { listArticles, broadcastOne } from './broadcast';

export const prerender = false;

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Appelée automatiquement par le cron Vercel (voir vercel.json).
// Diffuse les articles NOUVEAUX (jamais connus) quand l'interrupteur auto est ON.
export const GET: APIRoute = async ({ request }) => {
  // Sécurité optionnelle : si CRON_SECRET est défini, on l'exige (Vercel l'envoie tout seul).
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ ok: false }, 401);
  }

  const auto = (await getJSON('broadcast:auto')) === true;
  if (!auto) return json({ ok: true, skipped: 'auto off' });

  const apiKey = getBrevoKey();
  if (!apiKey) return json({ ok: false, error: 'config' }, 500);

  const known: string[] = (await getJSON('broadcast:known')) || [];
  const fresh = (await listArticles()).filter((a) => !known.includes(a.slug));

  // garde-fou : au plus 5 nouveaux articles par exécution (évite tout envoi massif)
  const toSend = fresh.slice(0, 5);
  const results: any[] = [];
  for (const a of toSend) {
    const r = await broadcastOne(apiKey, a);
    results.push({ slug: a.slug, ok: r.ok, error: r.error });
  }
  return json({ ok: true, sent: results.filter((r) => r.ok).length, results });
};
