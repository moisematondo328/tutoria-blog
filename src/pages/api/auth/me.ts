import type { APIRoute } from 'astro';
import { readSession, safe, googleConfigured } from '../../../lib/auth';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const GET: APIRoute = async ({ cookies }) => {
  const user = await readSession(cookies);
  return json({ user: user ? safe(user) : null, googleEnabled: googleConfigured() });
};
