// Offres Tutoria Academy + moyens de paiement (RDC).
// Prix indicatifs (ajustables) ; l'activation réelle se branchera à l'étape back.
export type PlanId = 'free' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number; // USD
  yearly: number; // USD
  features: string[];
  cta: string;
  highlight?: boolean;
}

export const CURRENCY = 'USD';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    tagline: 'Pour commencer et prendre l\'habitude.',
    monthly: 0,
    yearly: 0,
    features: [
      'Tous les articles',
      'Les leçons gratuites des 4 domaines',
      'Quiz et suivi de progression',
      'Fiches PDF des leçons gratuites',
    ],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Débloque tout, va au bout de chaque parcours.',
    monthly: 5,
    yearly: 45,
    features: [
      'Tout Découverte, plus :',
      'Toutes les leçons premium des 4 domaines',
      'Tous les parcours complets et leurs fiches PDF',
      'Accès aux nouveaux cours en priorité',
      'Badge Premium sur ton profil',
    ],
    cta: 'Passer à Premium',
    highlight: true,
  },
];

export const getPlan = (id: PlanId): Plan => PLANS.find((p) => p.id === id) || PLANS[0];

// Accompagnement expert : le PRODUIT payant. Le contenu (cours, leçons, outils) reste gratuit.
// On monétise l'accompagnement humain, demandé volontairement.
export interface AccompFormat { id: string; label: string; price: number; per: string; desc: string; highlight?: boolean; }
export const ACCOMP = {
  name: 'Accompagnement',
  tagline: 'Un expert de ton domaine, rien que pour toi.',
  blurb: "Les cours sont gratuits. Quand tu veux aller plus loin avec quelqu'un qui te suit vraiment, tu demandes un accompagnement : un expert du domaine te guide, à ton rythme.",
  cta: 'Demander un accompagnement',
  steps: [
    { t: 'Tu demandes', d: "Tu dis ton domaine et ton objectif. Aucune obligation, aucun paiement à ce stade." },
    { t: 'Tu t\'inscris et tu réserves', d: 'Tu crées ton compte et tu règles ton accompagnement. C\'est ce qui déclenche le suivi.' },
    { t: 'Ton espace d\'accompagnement', d: 'L\'expert te retrouve dans ton compte : objectifs, plan d\'action, points réguliers.' },
  ],
  formats: [
    { id: 'seance', label: 'Séance découverte', price: 15, per: 'la séance', desc: 'Un échange ciblé de 45 min pour débloquer un point précis.' },
    { id: 'mensuel', label: 'Suivi mensuel', price: 49, per: 'par mois', desc: 'Un accompagnement régulier : objectifs, plan d\'action, points chaque semaine.', highlight: true },
  ] as AccompFormat[],
};

// Moyens de paiement proposés (front). Le traitement réel sera configuré ensuite.
export interface PayMethod { id: string; label: string; kind: 'mobile' | 'card'; hint?: string; }
export const PAY_METHODS: PayMethod[] = [
  { id: 'airtel', label: 'Airtel Money', kind: 'mobile', hint: 'Numéro Airtel' },
  { id: 'orange', label: 'Orange Money', kind: 'mobile', hint: 'Numéro Orange' },
  { id: 'mpesa', label: 'M-Pesa (Vodacom)', kind: 'mobile', hint: 'Numéro Vodacom' },
  { id: 'africell', label: 'Africell Money', kind: 'mobile', hint: 'Numéro Africell' },
  { id: 'card', label: 'Carte bancaire', kind: 'card', hint: 'Visa / Mastercard' },
];

export const yearlySavingPct = (p: Plan): number => {
  if (!p.monthly || !p.yearly) return 0;
  return Math.round((1 - p.yearly / (p.monthly * 12)) * 100);
};
