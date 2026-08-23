// Couche identité de Tutoria Academy : utilisateurs, mots de passe (scrypt),
// sessions (cookie httpOnly + Redis), jetons de vérification / réinitialisation,
// e-mails transactionnels (Brevo) et OAuth Google. Aucune dépendance externe.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { getJSON, setJSON, setJSONEx, del } from './store';
import { getBrevoKey } from './brevo';

export const SESSION_COOKIE = 'tuto_session';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 jours
const VERIFY_TTL = 60 * 60 * 24; // 24 h
const RESET_TTL = 60 * 60; // 1 h
const SENDER = { name: 'Tutoria Academy', email: 'tutorianews@gmail.com' };

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null; // null si compte Google uniquement
  provider: 'email' | 'google';
  verified: boolean;
  avatar?: string;
  createdAt: number;
}
export type SafeUser = Omit<User, 'passwordHash'>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normEmail = (e: string) => e.trim().toLowerCase();
export const safe = (u: User): SafeUser => {
  const { passwordHash, ...rest } = u;
  return rest;
};

// ---------- Mots de passe (scrypt, sans dépendance) ----------
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  const dk = scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${dk}`;
}
export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, dk] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !dk) return false;
  const calc = scryptSync(pw, salt, 64);
  const exp = Buffer.from(dk, 'hex');
  return calc.length === exp.length && timingSafeEqual(calc, exp);
}
const token = () => randomBytes(32).toString('base64url');

// ---------- Utilisateurs (Redis) ----------
const kUser = (id: string) => `user:${id}`;
const kByEmail = (email: string) => `user:byEmail:${normEmail(email)}`;
const kSession = (t: string) => `session:${t}`;
const kVerify = (t: string) => `verify:${t}`;
const kReset = (t: string) => `reset:${t}`;
const kProgress = (id: string) => `user:${id}:progress`;

export async function getUserById(id: string): Promise<User | null> {
  return getJSON<User>(kUser(id));
}
export async function getUserByEmail(email: string): Promise<User | null> {
  const ref = await getJSON<{ id: string }>(kByEmail(email));
  return ref?.id ? getUserById(ref.id) : null;
}
export async function saveUser(u: User): Promise<void> {
  await setJSON(kUser(u.id), u);
  await setJSON(kByEmail(u.email), { id: u.id });
}
export async function createUser(input: {
  email: string; name: string; password?: string; provider: 'email' | 'google'; verified?: boolean; avatar?: string;
}): Promise<User> {
  const u: User = {
    id: randomBytes(9).toString('base64url'),
    email: normEmail(input.email),
    name: input.name.trim() || normEmail(input.email).split('@')[0],
    passwordHash: input.password ? hashPassword(input.password) : null,
    provider: input.provider,
    verified: input.verified ?? false,
    avatar: input.avatar,
    createdAt: Date.now(),
  };
  await saveUser(u);
  return u;
}

// ---------- Sessions ----------
export async function createSession(userId: string, cookies: AstroCookies): Promise<void> {
  const t = token();
  await setJSONEx(kSession(t), { userId, createdAt: Date.now() }, SESSION_TTL);
  cookies.set(SESSION_COOKIE, t, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL,
  });
}
export async function readSession(cookies: AstroCookies): Promise<User | null> {
  const t = cookies.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const s = await getJSON<{ userId: string }>(kSession(t));
  if (!s?.userId) return null;
  return getUserById(s.userId);
}
export async function destroySession(cookies: AstroCookies): Promise<void> {
  const t = cookies.get(SESSION_COOKIE)?.value;
  if (t) await del(kSession(t));
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

// ---------- Jetons de vérification / réinitialisation ----------
export async function issueVerifyToken(userId: string): Promise<string> {
  const t = token();
  await setJSONEx(kVerify(t), { userId }, VERIFY_TTL);
  return t;
}
export async function consumeVerifyToken(t: string): Promise<string | null> {
  const v = await getJSON<{ userId: string }>(kVerify(t));
  if (!v?.userId) return null;
  await del(kVerify(t));
  return v.userId;
}
export async function issueResetToken(userId: string): Promise<string> {
  const t = token();
  await setJSONEx(kReset(t), { userId }, RESET_TTL);
  return t;
}
export async function consumeResetToken(t: string): Promise<string | null> {
  const v = await getJSON<{ userId: string }>(kReset(t));
  if (!v?.userId) return null;
  await del(kReset(t));
  return v.userId;
}

// ---------- Progression ----------
export type Progress = Record<string, number>; // "courseId/lessonSlug" -> timestamp
export const progressKey = (course: string, lesson: string) => `${course}/${lesson}`;
export async function getProgress(userId: string): Promise<Progress> {
  return (await getJSON<Progress>(kProgress(userId))) || {};
}
export async function setLessonDone(userId: string, course: string, lesson: string, done: boolean): Promise<Progress> {
  const p = await getProgress(userId);
  const key = progressKey(course, lesson);
  if (done) p[key] = Date.now();
  else delete p[key];
  await setJSON(kProgress(userId), p);
  return p;
}

// ---------- E-mails transactionnels (Brevo) ----------
async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = getBrevoKey();
  if (!apiKey) return false;
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: SENDER, to: [{ email: to }], subject, htmlContent: html }),
  }).catch(() => null);
  return !!(r && r.ok);
}
function shell(title: string, body: string): string {
  return `
  <div style="background:#F2F6F3;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0A2621;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #DBE7E2;">
      <div style="background:#0A2621;padding:22px 28px;">
        <span style="font-size:20px;font-weight:800;color:#fff;">Tutoria</span><span style="font-size:20px;font-weight:800;color:#17B39D;"> Academy</span>
      </div>
      <div style="height:4px;background:#FDD200;"></div>
      <div style="padding:30px 28px;">
        <h1 style="margin:0 0 14px;font-size:20px;color:#0B6E64;">${title}</h1>
        ${body}
      </div>
      <div style="padding:16px 28px 22px;border-top:1px solid #DBE7E2;color:#5B726B;font-size:12px;">Tutoria Academy · Apprends, comprends, applique.</div>
    </div>
  </div>`;
}
function ctaButton(href: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:#FDD200;color:#0b6e64;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;font-size:15px;">${label}</a></div>`;
}
export async function sendVerifyEmail(origin: string, user: User, tok: string): Promise<boolean> {
  const url = `${origin}/api/auth/verify?token=${tok}`;
  return sendMail(user.email, 'Confirme ton adresse e-mail', shell(
    `Bienvenue, ${escapeHtml(user.name)} !`,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Confirme ton adresse pour activer ton compte Tutoria Academy.</p>${ctaButton(url, 'Confirmer mon e-mail')}<p style="margin:16px 0 0;font-size:12px;color:#5B726B;">Ce lien expire dans 24 heures.</p>`,
  ));
}
export async function sendResetEmail(origin: string, user: User, tok: string): Promise<boolean> {
  const url = `${origin}/academy/compte/reinitialiser/?token=${tok}`;
  return sendMail(user.email, 'Réinitialise ton mot de passe', shell(
    'Mot de passe oublié ?',
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Clique ci-dessous pour choisir un nouveau mot de passe. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>${ctaButton(url, 'Choisir un nouveau mot de passe')}<p style="margin:16px 0 0;font-size:12px;color:#5B726B;">Ce lien expire dans 1 heure.</p>`,
  ));
}
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// ---------- Google OAuth ----------
export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
export function googleAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}
export function oauthState(): string {
  return randomBytes(16).toString('hex');
}
export function hashState(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}
export async function googleExchange(origin: string, code: string): Promise<{ email: string; name: string; avatar?: string; verified: boolean } | null> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  }).catch(() => null);
  if (!tokenRes || !tokenRes.ok) return null;
  const { access_token } = await tokenRes.json();
  if (!access_token) return null;
  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${access_token}` },
  }).catch(() => null);
  if (!info || !info.ok) return null;
  const g = await info.json();
  if (!g?.email) return null;
  return { email: g.email, name: g.name || g.given_name || '', avatar: g.picture, verified: !!g.email_verified };
}
