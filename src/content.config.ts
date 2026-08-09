import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    categorySlug: z.string().optional(),
    excerpt: z.string().optional().default(''),
    cover: z.string().optional().default(''),
    draft: z.boolean().optional().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional().default(''),
    cover: z.string().optional().default(''),
    description: z.string().optional().default(''),
    file: z.string().optional().default(''),
    readUrl: z.string().optional().default(''),
    available: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    youtube: z.string(), // lien YouTube ou identifiant de la vidéo
    order: z.number().optional().default(0),
  }),
});

export const collections = { blog, books, videos };
