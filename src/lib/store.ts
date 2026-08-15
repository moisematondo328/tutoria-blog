// Couche de stockage tolérante : marche avec l'API REST Upstash (KV_REST_API_* /
// UPSTASH_REDIS_REST_*) OU avec une URL Redis classique (REDIS_URL / KV_URL via ioredis).
// Ainsi, quelles que soient les variables injectées par Vercel, les commentaires fonctionnent.
import { Redis as UpstashRest } from '@upstash/redis';
import IORedis from 'ioredis';

type Mode = 'rest' | 'native' | null;
let client: any = null;
let mode: Mode = null;
let resolved = false;

function resolve() {
  if (resolved) return;
  resolved = true;
  const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && restToken) {
    client = new UpstashRest({ url: restUrl, token: restToken });
    mode = 'rest';
    return;
  }
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (url) {
    client = new IORedis(url, { maxRetriesPerRequest: 2, connectTimeout: 8000, enableOfflineQueue: true, lazyConnect: false });
    client.on('error', () => {}); // évite un crash non géré
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
  if (mode === 'rest') {
    return ((await client.get(key)) as T) ?? null; // Upstash REST désérialise le JSON
  }
  const raw = await client.get(key); // ioredis renvoie une chaîne
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  resolve();
  if (!client) return;
  if (mode === 'rest') {
    await client.set(key, value as any); // Upstash REST sérialise le JSON
    return;
  }
  await client.set(key, JSON.stringify(value));
}
