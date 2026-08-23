import type { APIRoute } from 'astro';
import { googleConfigured, googleAuthUrl, oauthState } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  if (!googleConfigured()) return redirect('/academy/compte/connexion/?error=google', 302);
  const origin = new URL(request.url).origin;
  const state = oauthState();
  cookies.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return redirect(googleAuthUrl(origin, state), 302);
};
