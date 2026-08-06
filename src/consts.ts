export const SITE = {
  title: 'Tutoria News',
  tagline: 'Le guide de survie du quotidien',
  description:
    "Média éducatif francophone. Des contenus pratiques — Santé & Bien-être, Développement personnel, Finance & Investissement, Technologie émergente — pour comprendre et agir dès aujourd'hui.",
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
  { name: 'Finance & Investissement', slug: 'finance-investissement', color: '#0B6E64', icon: 'finance', blurb: 'Gérer, épargner, investir — même avec peu.' },
  { name: 'Technologie Émergente', slug: 'technologie-emergente', color: '#12A594', icon: 'tech', blurb: "L'IA et la tech au service de ton quotidien." },
];

export function pillarBySlug(slug: string): Pillar | undefined {
  return PILLARS.find((p) => p.slug === slug);
}
export function pillarByName(name: string): Pillar | undefined {
  const n = name.replace(/&amp;/g, '&').trim().toLowerCase();
  return PILLARS.find((p) => p.name.toLowerCase() === n);
}

// Temps de lecture approximatif à partir du HTML de l'article
export function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
