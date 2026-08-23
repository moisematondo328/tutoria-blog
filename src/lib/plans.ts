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

// Accompagnement expert : offre sur mesure (hors abonnement), gérée au cas par cas.
export const COACHING = {
  name: 'Accompagnement expert',
  tagline: 'Un expert de ton domaine, rien que pour toi.',
  blurb: 'Sessions personnalisées avec l\'expert du pilier : objectifs, plan d\'action, suivi. Tarif selon le format.',
  cta: 'Parler à un expert',
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
