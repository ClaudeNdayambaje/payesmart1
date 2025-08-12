/**
 * Utilitaires pour la gestion des dates dans l'application
 */

/**
 * Formate un timestamp en date lisible au format français
 * @param timestamp - Timestamp à formater (en millisecondes)
 * @returns Date formatée (ex: 21/04/2025)
 */
export const formatDate = (timestamp: number): string => {
  if (!timestamp) return '-';
  
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '-';
  }
};

/**
 * Formate un timestamp en date et heure lisibles au format français
 * @param timestamp - Timestamp à formater (en millisecondes)
 * @returns Date et heure formatées (ex: 21/04/2025 14:30)
 */
export const formatDateTime = (timestamp: number): string => {
  if (!timestamp) return '-';
  
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date et heure:', error);
    return '-';
  }
};

/**
 * Convertit un timestamp en chaîne de date pour les champs input de type date
 * @param timestamp - Timestamp à convertir (en millisecondes)
 * @returns Chaîne au format YYYY-MM-DD
 */
export const formatDateForInput = (timestamp: number): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur lors de la conversion de la date pour input:', error);
    return '';
  }
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param startTimestamp - Timestamp de début (en millisecondes)
 * @param endTimestamp - Timestamp de fin (en millisecondes)
 * @returns Nombre de jours entre les deux dates
 */
export const getDaysBetween = (startTimestamp: number, endTimestamp: number): number => {
  if (!startTimestamp || !endTimestamp) return 0;
  
  try {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((endTimestamp - startTimestamp) / millisecondsPerDay));
  } catch (error) {
    console.error('Erreur lors du calcul des jours entre deux dates:', error);
    return 0;
  }
};
