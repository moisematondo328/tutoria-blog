import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/auth';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ cookies }) => {
  await destroySession(cookies);
  return json({ ok: true });
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  await destroySession(cookies);
  return redirect('/academy/', 302);
};
