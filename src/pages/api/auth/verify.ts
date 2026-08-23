import type { APIRoute } from 'astro';
import { consumeVerifyToken, getUserById, saveUser, createSession } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const tok = new URL(request.url).searchParams.get('token') || '';
  const userId = tok ? await consumeVerifyToken(tok) : null;
  if (!userId) return redirect('/academy/compte/connexion/?error=verify', 302);
  const user = await getUserById(userId);
  if (!user) return redirect('/academy/compte/connexion/?error=verify', 302);
  if (!user.verified) { user.verified = true; await saveUser(user); }
  await createSession(user.id, cookies);
  return redirect('/academy/compte/?verified=1', 302);
};
