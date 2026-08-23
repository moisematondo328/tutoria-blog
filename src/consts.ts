export const SITE = {
  title: 'Tutoria News',
  tagline: 'Le guide de survie du quotidien',
  description:
    "Des conseils clairs et pratiques sur ta santé, tes finances, ton développement personnel et la tech. Tu lis, tu comprends, tu appliques.",
  slogan: 'Explorez, Apprenez, Partagez',
  author: 'Moïse Matondo',
};

export const SOCIALS = {
  facebook: 'https://www.facebook.com/tutorianews',
  tiktok: 'https://www.tiktok.com/@tutorianews',
  youtube: 'https://www.youtube.com/@TutoriaNews',
};

export const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'Academy', href: '/academy/' },
  { label: 'Articles', href: '/articles/' },
  { label: 'Livres', href: '/livres/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'À propos', href: '/a-propos/' },
];

export type Pillar = {
  name: string;
  slug: string;
  color: string;
  icon: string;
  blurb: string;
};

// Palette fidèle : teal profond + jaune, déclinés par pilier pour le rythme
export const PILLARS: Pillar[] = [
  { name: 'Santé & Bien-être', slug: 'sante-bien-etre', color: '#0E8074', icon: 'health', blurb: 'Des gestes simples pour ton corps et ton esprit.' },
  { name: 'Développement Personnel', slug: 'developpement-personnel', color: '#E0A400', icon: 'growth', blurb: 'Devenir plus fort, plus discipliné, plus serein.' },
  { name: 'Finance & Investissement', slug: 'finance-investissement', color: '#0B6E64', icon: 'finance', blurb: 'Gérer, épargner et investir, même avec peu.' },
  { name: 'Technologie Émergente', slug: 'technologie-emergente', color: '#12A594', icon: 'tech', blurb: "L'IA et la tech au service de ton quotidien." },
];

export type Expert = { name: string; slug: string; pillar: string; role: string; bio: string };
export const EXPERTS: Expert[] = [
  { name: 'Hervé Mulamba', slug: 'herve-mulamba', pillar: 'Développement Personnel', role: 'Coach en développement personnel', bio: "Il aide les jeunes à passer de l'intention à l'action : discipline, habitudes, mental. Du concret, pas de la théorie." },
  { name: 'Jemima Kanga', slug: 'jemima-kanga', pillar: 'Santé & Bien-être', role: 'Professionnelle de santé', bio: 'Elle traduit la santé en gestes simples du quotidien, adaptés au contexte africain. Prévenir plutôt que subir.' },
  { name: 'Glodi Kambembo', slug: 'glodi-kambembo', pillar: 'Finance & Investissement', role: "Expert en investissement", bio: "Il rend l'investissement accessible, même avec peu : où mettre son argent, quand, et pourquoi." },
  { name: 'Prince Modju', slug: 'prince-modju', pillar: 'Finance & Investissement', role: 'Vulgarisateur finance', bio: 'Il explique la finance sans jargon, avec des exemples locaux. Comprendre pour mieux décider.' },
  { name: 'Salem Balukisa', slug: 'salem-balukisa', pillar: 'Finance & Investissement', role: 'Expert-comptable & gestion', bio: 'Il structure ce qui fait tenir un budget et une petite activité : chiffres clairs, décisions saines.' },
  { name: 'Moïse Matondo', slug: 'moise-matondo', pillar: 'Technologie Émergente', role: 'Fondateur & développeur', bio: "Il met la tech et l'IA au service du quotidien : des outils concrets, expliqués pas à pas." },
];
export function expertBySlug(slug: string): Expert | undefined { return EXPERTS.find((e) => e.slug === slug); }
export function expertByName(name: string): Expert | undefined {
  const n = (name || '').trim().toLowerCase();
  return EXPERTS.find((e) => e.name.toLowerCase() === n);
}

export function pillarBySlug(slug: string): Pillar | undefined {
  return PILLARS.find((p) => p.slug === slug);
}
export function pillarByName(name: string): Pillar | undefined {
  const n = (name || '').replace(/&amp;/g, '&').trim().toLowerCase();
  return PILLARS.find((p) => p.name.toLowerCase() === n);
}

// Slug de rubrique : utilise categorySlug s'il existe, sinon le déduit du nom (pour les articles créés via le back-office)
export function catSlugOf(data: { category: string; categorySlug?: string }): string {
  return data.categorySlug || pillarByName(data.category)?.slug || 'actualites';
}

// Temps de lecture approximatif à partir du HTML de l'article
export function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Extrait l'identifiant d'une vidéo YouTube depuis un lien ou un ID brut
export function youtubeId(input: string): string {
  if (!input) return '';
  const m = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(input.trim()) ? input.trim() : '';
}
