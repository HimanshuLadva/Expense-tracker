const ICON_BADGE_PALETTE = [
  '#059669', '#0d9488', '#0891b2', '#2563eb', '#4f46e5',
  '#7c3aed', '#db2777', '#d97706', '#dc2626', '#65a30d'
];

export function getIconBadgeColor(index: number): string {
  return ICON_BADGE_PALETTE[index % ICON_BADGE_PALETTE.length];
}
