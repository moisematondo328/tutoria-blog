import type { APIRoute } from 'astro';
import { getBrevoKey } from '../../lib/brevo';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const esc = (s: string) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const b: any = await request.json().catch(() => ({}));
  const token = (b.turnstileToken || b['cf-turnstile-response'] || '').toString();
  if (!(await verifyTurnstile(token, clientAddress))) return json({ ok: false, error: 'captcha' }, 400);

  const name = (b.name || '').toString().trim();
  const email = (b.email || '').toString().trim();
  const reason = (b.reason || 'Message').toString().trim();
  const message = (b.message || '').toString().trim();
  if (!name || !EMAIL_RE.test(email) || !message) return json({ ok: false, error: 'invalid' }, 400);

  const apiKey = getBrevoKey();
  if (!apiKey) return json({ ok: false, error: 'config' }, 500);

  const html = `<div style="font-family:Arial,sans-serif;color:#0A2621">
    <h2 style="color:#0E8074;margin:0 0 12px">Nouveau message — Tutoria Academy</h2>
    <p><b>Nom :</b> ${esc(name)}</p>
    <p><b>E-mail :</b> ${esc(email)}</p>
    <p><b>Sujet :</b> ${esc(reason)}</p>
    <p><b>Message :</b></p>
    <p style="white-space:pre-wrap;background:#F2F6F3;padding:12px 14px;border-radius:10px">${esc(message)}</p>
  </div>`;

  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Tutoria Academy', email: 'tutorianews@gmail.com' },
      to: [{ email: 'tutorianews@gmail.com', name: 'Tutoria' }],
      replyTo: { email, name },
      subject: `Contact Academy — ${reason}`,
      htmlContent: html,
    }),
  }).catch(() => null);

  if (!r || !r.ok) return json({ ok: false, error: 'send' }, 502);
  return json({ ok: true });
};
