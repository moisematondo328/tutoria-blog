import type { APIRoute } from 'astro';
import { readSession, getProgress, setLessonDone } from '../../lib/auth';
import { hasStore } from '../../lib/store';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const GET: APIRoute = async ({ cookies }) => {
  const user = await readSession(cookies);
  if (!user) return json({ ok: false, error: 'auth' }, 401);
  return json({ ok: true, progress: await getProgress(user.id) });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasStore()) return json({ ok: false, error: 'config' }, 500);
  const user = await readSession(cookies);
  if (!user) return json({ ok: false, error: 'auth' }, 401);
  const b: any = await request.json().catch(() => ({}));
  const course = (b.course || '').toString();
  const lesson = (b.lesson || '').toString();
  const done = !!b.done;
  if (!course || !lesson) return json({ ok: false, error: 'invalid' }, 400);
  const progress = await setLessonDone(user.id, course, lesson, done);
  return json({ ok: true, progress });
};
