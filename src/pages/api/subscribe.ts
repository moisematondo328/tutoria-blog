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

export const POST: APIRoute = async ({ request }) => {
  const apiKey = process.env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY;
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
