// Cloudflare Turnstile — anti-spam des formulaires (contact, inscription).
// En local / sans clés, on retombe sur les CLÉS DE TEST officielles (toujours valides),
// donc les formulaires marchent sans configuration. En prod, poser sur Vercel :
//   PUBLIC_TURNSTILE_SITE_KEY  +  TURNSTILE_SECRET_KEY
const TEST_SITE = '1x00000000000000000000AA';
const TEST_SECRET = '1x0000000000000000000000000000000AA';

// Clé publique (site) — lisible côté page (variable PUBLIC_*).
export const turnstileSiteKey = (): string =>
  import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE;

// Vérification serveur du jeton renvoyé par le widget.
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY || TEST_SECRET;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const d = await r.json();
    return !!d?.success;
  } catch {
    return false;
  }
}
