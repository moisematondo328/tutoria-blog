import type { APIRoute } from 'astro';
import { EMAIL_RE, normEmail, getUserByEmail, verifyPassword, createSession, safe } from '../../../lib/auth';
import { hasStore } from '../../../lib/store';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

async function readBody(request: Request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json().catch(() => ({}));
  const f = await request.formData().catch(() => null);
  return f ? Object.fromEntries(f.entries()) : {};
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  const b: any = await readBody(request);
  const email = normEmail((b.email || '').toString());
  const password = (b.password || '').toString();
  if (!EMAIL_RE.test(email) || !password) return json({ ok: false, error: 'invalid' }, 400);

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ ok: false, error: 'credentials' }, 401);
  }
  await createSession(user.id, cookies);
  return json({ ok: true, user: safe(user) });
};
