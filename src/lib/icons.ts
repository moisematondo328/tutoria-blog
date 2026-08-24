// Jeu d'icônes DUOTONE Tutoria : trait principal = `currentColor` (s'adapte au contexte),
// accent = `var(--ac-ic-accent)` (jaune de marque). Chaque svg wrapper fixe la couleur + l'accent.
// Usage : <svg viewBox="0 0 24 24" set:html={ICONS.home}></svg>
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const A = 'stroke="var(--ac-ic-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const AF = 'fill="var(--ac-ic-accent)" stroke="none"';

export const ICONS: Record<string, string> = {
  // Barre utilitaire
  home: `<path ${S} d="M3 11l9-7 9 7"/><path ${S} d="M5 10v10h14V10"/><rect x="10" y="13.5" width="4" height="6.5" rx="1" ${AF}/>`,
  board: `<rect x="3" y="4" width="18" height="13" rx="2" ${S}/><path ${S} d="M8 21h8M12 17v4"/><path ${A} d="M7 11q2.5 -3.5 5 0 t5 0"/>`,
  terminal: `<rect x="3" y="4" width="18" height="16" rx="2" ${S}/><path ${A} d="M7 9l3 3-3 3"/><path ${S} d="M13 15h4"/>`,
  chart: `<path ${S} d="M4 4v16h16"/><path ${A} d="M7 14l4-5 3 3 4-6"/>`,
  code: `<path ${S} d="M8 8l-4 4 4 4M16 8l4 4-4 4"/><path ${A} d="M13.5 7l-3 10"/>`,
  article: `<path ${S} d="M5 3h9l5 5v13H5z"/><path ${S} d="M14 3v5h5"/><path ${A} d="M8 13h8M8 17h5"/>`,
  tools: `<path ${S} d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-6 6 2.9 2.9 6-6a4 4 0 0 0 5.2-5.4l-2.5 2.5-2-2z"/><circle cx="17.4" cy="6.6" r="1.7" ${AF}/>`,
  pen: `<path ${S} d="M12 20h9"/><path ${S} d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/><path ${A} d="M14.5 5.5l3 3"/>`,
  // Domaines (piliers)
  health: `<path ${S} d="M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3 1.2 4 2.5C11 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21z"/><path ${A} d="M6 12.5h2.4l1.4-3 2 5 1.3-2h3"/>`,
  growth: `<path ${S} d="M3 17l6-6 4 4 7-7"/><path ${A} d="M14 7h6v6"/>`,
  finance: `<circle cx="12" cy="12" r="9" ${S}/><path ${A} d="M14.5 9.2a3 3 0 0 0-4.5 2.6 3 3 0 0 0 4.5 2.6M12 6.5v11"/>`,
  tech: `<rect x="6" y="6" width="12" height="12" rx="2" ${S}/><path ${S} d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><rect x="10" y="10" width="4" height="4" rx="1" ${AF}/>`,
};

// Icône par slug de domaine
export const PILLAR_ICON: Record<string, string> = {
  'sante-bien-etre': ICONS.health,
  'developpement-personnel': ICONS.growth,
  'finance-investissement': ICONS.finance,
  'technologie-emergente': ICONS.tech,
};
