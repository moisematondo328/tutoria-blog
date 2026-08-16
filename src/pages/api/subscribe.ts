import type { APIRoute } from 'astro';

// Cette route tourne à la demande (fonction serveur), pas au build.
export const prerender = false;

// La liste Brevo qui reçoit les abonnés (liste #3 « Tutoria News »).
const BREVO_LIST_ID = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Trouve la clé Brevo : d'abord par son nom, sinon par son format (xkeysib-…),
// quel que soit le nom de la variable d'environnement.
function getBrevoKey(): string | undefined {
  const direct = process.env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY;
  if (direct) return direct;
  for (const v of Object.values(process.env)) {
    if (typeof v === 'string' && v.startsWith('xkeysib-')) return v;
  }
  return undefined;
}

// E-mail de bienvenue (transactionnel Brevo), depuis l'expéditeur vérifié Tutoria News.
async function sendWelcome(email: string, apiKey: string): Promise<void> {
  const html = `
  <div style="background:#f1f7f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#23302e;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e7edeb;">
      <div style="background:#0E8074;padding:26px 28px;text-align:center;">
        <div style="font-size:26px;font-weight:800;color:#fff;">Tutoria<span style="color:#FDD200;"> News</span></div>
        <div style="color:#bfe4dd;font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-top:6px;">Explorez &middot; Apprenez &middot; Partagez</div>
      </div>
      <div style="padding:30px 28px;">
        <h1 style="margin:0 0 14px;font-size:22px;color:#0E8074;">Content de t'avoir avec nous !</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Tu viens de rejoindre <b>Tutoria News</b>, et c'est une belle décision. Ici, on prend les vrais sujets de ta vie (ta <b>santé</b>, ton <b>argent</b>, ton <b>développement personnel</b>, la <b>tech</b>) et on te les explique simplement, pour que tu puisses agir dès aujourd'hui.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">À chaque message, tu repars avec du concret : une idée, une astuce ou une méthode prête à l'emploi. Jamais de blabla, que de l'utile.</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Notre façon de faire tient en trois mots : <b>tu lis, tu comprends, tu appliques.</b></p>
        <p style="margin:0 0 4px;font-size:15px;line-height:1.6;">En attendant le prochain rendez-vous, découvre ce qu'on a déjà écrit pour toi.</p>
        <div style="text-align:center;margin:26px 0 6px;">
          <a href="https://tutoria-blog.vercel.app/articles/" style="display:inline-block;background:#FDD200;color:#0b6e64;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;font-size:15px;">Lire nos derniers articles</a>
        </div>
      </div>
      <div style="padding:16px 28px 22px;border-top:1px solid #e7edeb;text-align:center;color:#6b7a78;font-size:12px;">
        Tu reçois ce message car tu t'es inscrit à la newsletter Tutoria News.<br>Tu peux te désinscrire à tout moment.
      </div>
    </div>
  </div>`;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Tutoria News', email: 'tutorianews@gmail.com' },
      to: [{ email }],
      subject: 'Bienvenue chez Tutoria News',
      htmlContent: html,
    }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = getBrevoKey();
  if (!apiKey) {
    // Variable pas encore configurée sur Vercel.
    return json({ success: false, error: 'config' }, 500);
  }

  // On accepte du JSON ({ email }) comme du formulaire classique.
  let email = '';
  const type = request.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) {
      const body = await request.json();
      email = (body?.email || '').toString().trim();
    } else {
      const form = await request.formData();
      email = (form.get('email') || '').toString().trim();
    }
  } catch {
    return json({ success: false, error: 'invalid' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ success: false, error: 'email' }, 400);
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [BREVO_LIST_ID],
      updateEnabled: true, // ne casse pas si le contact existe déjà
    }),
  });

  // 201 = nouveau contact -> on envoie le mail de bienvenue (sans bloquer si l'envoi échoue).
  if (res.status === 201) {
    await sendWelcome(email, apiKey).catch(() => {});
    return json({ success: true, welcomed: true });
  }
  // 204 = contact déjà présent, mis à jour -> pas de mail (évite le spam de réinscription).
  if (res.ok || res.status === 204) {
    return json({ success: true });
  }

  // Brevo répond 400 « duplicate_parameter » si l'adresse est déjà inscrite :
  // pour l'utilisateur, c'est un succès.
  const data = await res.json().catch(() => ({} as any));
  if (data?.code === 'duplicate_parameter') {
    return json({ success: true, already: true });
  }

  return json({ success: false, error: data?.message || 'brevo' }, 502);
};
