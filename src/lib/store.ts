// Couche de stockage tolérante ET agnostique au préfixe : elle retrouve les
// variables Redis quel que soit leur nom (KV_*, UPSTASH_*, STORAGE_*, REDIS_URL…).
// Ainsi, peu importe le préfixe choisi lors de la connexion Vercel, ça marche.
import { Redis as UpstashRest } from '@upstash/redis';
import IORedis from 'ioredis';

type Mode = 'rest' | 'native' | null;
let client: any = null;
let mode: Mode = null;
let resolved = false;

function findRest(): { url: string; token: string } | null {
  const env = process.env as Record<string, string | undefined>;
  const keys = Object.keys(env);
  const urlKey = keys.find((k) => /REST(_API)?_URL$/.test(k) && (env[k] || '').startsWith('http'));
  const tokKey = keys.find((k) => /REST(_API)?_TOKEN$/.test(k) && !/READ_ONLY/.test(k) && env[k]);
  if (urlKey && tokKey) return { url: env[urlKey]!, token: env[tokKey]! };
  return null;
}

function findNativeUrl(): string | null {
  const env = process.env as Record<string, string | undefined>;
  for (const k of ['REDIS_URL', 'KV_URL', 'STORAGE_URL', 'STORAGE_REDIS_URL', 'STORAGE_KV_URL']) {
    if (env[k] && /^rediss?:\/\//.test(env[k]!)) return env[k]!;
  }
  const k = Object.keys(env).find((kk) => /^rediss?:\/\//.test(env[kk] || ''));
  return k ? env[k]! : null;
}

function resolve() {
  if (resolved) return;
  resolved = true;
  const rest = findRest();
  if (rest) {
    client = new UpstashRest({ url: rest.url, token: rest.token });
    mode = 'rest';
    return;
  }
  const url = findNativeUrl();
  if (url) {
    client = new IORedis(url, { maxRetriesPerRequest: 2, connectTimeout: 8000, enableOfflineQueue: true, lazyConnect: false });
    client.on('error', () => {});
    mode = 'native';
  }
}

export function hasStore(): boolean {
  resolve();
  return !!client;
}

export async function getJSON<T = any>(key: string): Promise<T | null> {
  resolve();
  if (!client) return null;
  if (mode === 'rest') return ((await client.get(key)) as T) ?? null;
  const raw = await client.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  resolve();
  if (!client) return;
  if (mode === 'rest') { await client.set(key, value as any); return; }
  await client.set(key, JSON.stringify(value));
}

// Écrit une valeur avec expiration (secondes) : sessions, jetons de vérif/réinit.
export async function setJSONEx(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  resolve();
  if (!client) return;
  if (mode === 'rest') { await client.set(key, value as any, { ex: ttlSeconds }); return; }
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function del(key: string): Promise<void> {
  resolve();
  if (!client) return;
  await client.del(key);
}
