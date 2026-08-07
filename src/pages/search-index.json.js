import { getCollection } from 'astro:content';
import { catSlugOf } from '../consts';

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()
  );
  const data = posts.map((p) => ({
    title: p.data.title,
    excerpt: p.data.excerpt || '',
    category: p.data.category,
    categorySlug: catSlugOf(p.data),
    url: `/blog/${p.id}/`,
    cover: p.data.cover || '',
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
