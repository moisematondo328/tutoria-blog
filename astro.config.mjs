// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import sentry from '@sentry/astro';

// Sentry n'est actif QUE si SENTRY_DSN est posé (Vercel). Sans DSN : intégration
// non chargée -> zéro impact sur le dev et le build.
const sentryIntegration = process.env.SENTRY_DSN
  ? [sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || 'development',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      sourceMapsUploadOptions: { enabled: false },
    })]
  : [];

// Site statique + fonctions serveur (routes `export const prerender = false`).
export default defineConfig({
  site: 'https://tutoria-blog.vercel.app',
  // maxDuration élevé : /api/publish compose plusieurs images (Pexels + sharp) puis commit.
  adapter: vercel({ maxDuration: 60 }),
  integrations: [...sentryIntegration, sitemap({ filter: (page) => !/\/(admin|moderation)/.test(page) })],
});
