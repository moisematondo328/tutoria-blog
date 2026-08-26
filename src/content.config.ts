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

// Série de leçons structurée (par pilier, portée par un expert). Le corps du .md = la présentation.
//   kind   'tutoriel' = gratuit, l'aimant (parcours d'apprentissage) ; 'cours' = payant, porté par un expert.
//   access 'free' | 'paid' — dérive de kind par défaut mais reste réglable (ex. tutoriel avec module bonus).
const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    category: z.string(), // pilier
    kind: z.enum(['tutoriel', 'cours']).optional().default('tutoriel'),
    access: z.enum(['free', 'paid']).optional().default('free'),
    expert: z.string().optional().default(''),
    cover: z.string().optional().default(''),
    excerpt: z.string().optional().default(''),
    level: z.string().optional().default('Débutant'),
    order: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
  }),
});

// Leçon = une étape d'un cours. `course` = slug du cours ; `order` = position ; `premium` = verrouillée (Phase 3).
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    course: z.string(),
    order: z.number().optional().default(0),
    premium: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
    quiz: z.array(z.object({
      q: z.string(),
      options: z.array(z.object({ t: z.string(), correct: z.boolean().optional().default(false) })),
    })).optional().default([]),
  }),
});

export const collections = { blog, books, videos, courses, lessons };
