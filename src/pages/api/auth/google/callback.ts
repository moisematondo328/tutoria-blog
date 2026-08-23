import type { APIRoute } from 'astro';
import { googleConfigured, googleExchange, getUserByEmail, createUser, saveUser, createSession } from '../../../../lib/auth';

export const prerender = false;
const fail = (redirect: any) => redirect('/academy/compte/connexion/?error=google', 302);

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  if (!googleConfigured()) return fail(redirect);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const saved = cookies.get('oauth_state')?.value;
  cookies.delete('oauth_state', { path: '/' });
  if (!code || !state || !saved || state !== saved) return fail(redirect);

  const g = await googleExchange(url.origin, code);
  if (!g) return fail(redirect);

  let user = await getUserByEmail(g.email);
  if (!user) {
    user = await createUser({ email: g.email, name: g.name, provider: 'google', verified: g.verified, avatar: g.avatar });
  } else if (!user.verified && g.verified) {
    user.verified = true;
    if (!user.avatar && g.avatar) user.avatar = g.avatar;
    await saveUser(user);
  }
  await createSession(user.id, cookies);
  return redirect('/academy/compte/', 302);
};
