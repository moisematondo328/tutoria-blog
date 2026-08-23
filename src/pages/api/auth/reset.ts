import type { APIRoute } from 'astro';
import { consumeResetToken, getUserById, saveUser, hashPassword, createSession, safe } from '../../../lib/auth';
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
  const tok = (b.token || '').toString();
  const password = (b.password || '').toString();
  if (!tok) return json({ ok: false, error: 'token' }, 400);
  if (password.length < 8) return json({ ok: false, error: 'password' }, 400);

  const userId = await consumeResetToken(tok);
  if (!userId) return json({ ok: false, error: 'expired' }, 400);
  const user = await getUserById(userId);
  if (!user) return json({ ok: false, error: 'expired' }, 400);

  user.passwordHash = hashPassword(password);
  user.verified = true; // le lien reçu par e-mail prouve l'adresse
  await saveUser(user);
  await createSession(user.id, cookies);
  return json({ ok: true, user: safe(user) });
};
