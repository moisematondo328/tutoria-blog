import type { APIRoute } from 'astro';
import { EMAIL_RE, normEmail, getUserByEmail, createUser, createSession, issueVerifyToken, sendVerifyEmail, safe } from '../../../lib/auth';
import { hasStore } from '../../../lib/store';
import { verifyTurnstile } from '../../../lib/turnstile';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

async function readBody(request: Request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json().catch(() => ({}));
  const f = await request.formData().catch(() => null);
  return f ? Object.fromEntries(f.entries()) : {};
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  const b: any = await readBody(request);

  const token = (b.turnstileToken || b['cf-turnstile-response'] || '').toString();
  if (!(await verifyTurnstile(token, clientAddress))) return json({ ok: false, error: 'captcha' }, 400);

  const email = normEmail((b.email || '').toString());
  const name = (b.name || '').toString().trim();
  const password = (b.password || '').toString();

  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'email' }, 400);
  if (password.length < 8) return json({ ok: false, error: 'password' }, 400);

  const existing = await getUserByEmail(email);
  if (existing) return json({ ok: false, error: 'exists' }, 409);

  const user = await createUser({ email, name, password, provider: 'email', verified: false });
  const tok = await issueVerifyToken(user.id);
  await sendVerifyEmail(new URL(request.url).origin, user, tok).catch(() => {});
  await createSession(user.id, cookies);
  return json({ ok: true, user: safe(user) });
};
