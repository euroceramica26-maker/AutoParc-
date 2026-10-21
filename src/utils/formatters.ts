/**
 * Utilitaires de formatage monétaire et numérique pour le Dirham Marocain (DH)
 */

export const formatDH = (amount: number | undefined | null): string => {
  const val = Number(amount || 0);
  return `${val.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
};

export const formatNumber = (val: number | undefined | null): string => {
  return Number(val || 0).toLocaleString('fr-MA');
};
