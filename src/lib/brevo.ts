// Helpers Brevo partagés (clé + envoi de campagne à la liste + gabarit d'e-mail article).
export const BREVO_LIST_ID = 3;
export const SENDER = { name: 'Tutoria News', email: 'tutorianews@gmail.com' };
export const SITE_URL = 'https://tutoria-blog.vercel.app';

// Trouve la clé Brevo par son nom, sinon par son format (xkeysib-…).
export function getBrevoKey(): string | undefined {
  const direct = process.env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY;
  if (direct) return direct;
  for (const v of Object.values(process.env)) {
    if (typeof v === 'string' && v.startsWith('xkeysib-')) return v;
  }
  return undefined;
}

// Crée une campagne classique ciblant la liste, puis l'envoie immédiatement.
export async function createAndSendCampaign(opts: {
  apiKey: string; name: string; subject: string; htmlContent: string; listIds?: number[];
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  const create = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: { 'api-key': opts.apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      name: opts.name,
      subject: opts.subject,
      sender: SENDER,
      type: 'classic',
      htmlContent: opts.htmlContent,
      recipients: { listIds: opts.listIds || [BREVO_LIST_ID] },
    }),
  });
  if (!create.ok) {
    const e = await create.json().catch(() => ({} as any));
    return { ok: false, error: e?.message || `création ${create.status}` };
  }
  const { id } = await create.json();
  const send = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`, {
    method: 'POST', headers: { 'api-key': opts.apiKey, accept: 'application/json' },
  });
  if (!(send.ok || send.status === 204)) {
    const e = await send.json().catch(() => ({} as any));
    return { ok: false, id, error: e?.message || `envoi ${send.status}` };
  }
  return { ok: true, id };
}

// Gabarit d'e-mail d'un article, à la charte Tutoria.
export function articleEmailHtml(a: { title: string; excerpt?: string; cover?: string; url: string }): string {
  const cover = a.cover
    ? `<a href="${a.url}"><img src="${a.cover.startsWith('http') ? a.cover : SITE_URL + a.cover}" alt="" style="width:100%;max-width:560px;display:block;border:0;" /></a>`
    : '';
  return `
  <div style="background:#f1f7f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#23302e;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e7edeb;">
      <div style="background:#0E8074;padding:22px 28px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#fff;">Tutoria<span style="color:#FDD200;"> News</span></div>
      </div>
      ${cover}
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0E8074;">${a.title}</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${a.excerpt || ''}</p>
        <div style="text-align:center;margin:6px 0;">
          <a href="${a.url}" style="display:inline-block;background:#FDD200;color:#0b6e64;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;font-size:15px;">Lire l'article</a>
        </div>
      </div>
      <div style="padding:16px 28px 22px;border-top:1px solid #e7edeb;text-align:center;color:#6b7a78;font-size:12px;">
        Tu reçois cet e-mail car tu es abonné à Tutoria News.<br>
        <a href="{{ unsubscribe }}" style="color:#6b7a78;">Se désinscrire</a>
      </div>
    </div>
  </div>`;
}
