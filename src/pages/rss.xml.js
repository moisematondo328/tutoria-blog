import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

// Flux RSS des articles — sert à la diffusion automatique (newsletter Brevo RSS,
// agrégateurs, partage réseaux via Make/Zapier). URL : /rss.xml
export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? 'https://tutoria-blog.vercel.app',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt || '',
      pubDate: new Date(p.data.date),
      link: `/blog/${p.id}/`,
      categories: p.data.category ? [p.data.category] : [],
    })),
    customData: `<language>fr</language>`,
  });
}
