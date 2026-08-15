// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Site statique + fonctions serveur (routes `export const prerender = false`) :
// /api/subscribe (newsletter Brevo), /api/comments + /api/moderate (commentaires maison).
export default defineConfig({
  site: 'https://tutoria-blog.vercel.app',
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes('/moderation') })],
});
