import type { APIRoute } from 'astro';
import { EMAIL_RE, normEmail, getUserByEmail, issueResetToken, sendResetEmail } from '../../../lib/auth';
import { hasStore } from '../../../lib/store';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

async function readBody(request: Request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json().catch(() => ({}));
  const f = await request.formData().catch(() => null);
  return f ? Object.fromEntries(f.entries()) : {};
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  const b: any = await readBody(request);
  const email = normEmail((b.email || '').toString());
  // Réponse identique que le compte existe ou non (pas de fuite d'information).
  if (EMAIL_RE.test(email)) {
    const user = await getUserByEmail(email);
    if (user) {
      const tok = await issueResetToken(user.id);
      await sendResetEmail(new URL(request.url).origin, user, tok).catch(() => {});
    }
  }
  return json({ ok: true });
};
