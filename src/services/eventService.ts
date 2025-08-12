// Service pour gérer les événements personnalisés dans l'application
// Permet la communication entre composants sans props drilling

/**
 * Types d'événements disponibles dans l'application
 */
export type AppEventType = 
  | 'stockUpdated'        // Déclenché lorsque le stock d'un produit est mis à jour
  | 'productsUpdated'     // Déclenché lorsque la liste des produits est mise à jour
  | 'salesUpdated'        // Déclenché lorsque les ventes sont mises à jour
  | 'themeChanged'        // Déclenché lorsque le thème est changé
  | 'forceThemeUpdate'    // Force la mise à jour du thème
  | 'productDeleted';     // Déclenché lorsqu'un produit est supprimé

/**
 * Données associées à un événement
 */
export interface AppEventData {
  type: AppEventType;
  payload?: any;
}

/**
 * Émet un événement personnalisé dans l'application
 * @param eventType Type d'événement à émettre
 * @param payload Données optionnelles associées à l'événement
 */
export const emitEvent = (eventType: AppEventType, payload?: any): void => {
  console.log(`Émission d'événement: ${eventType}`, payload);
  
  // Créer un événement personnalisé avec les données
  const event = new CustomEvent<AppEventData>('app-event', {
    detail: {
      type: eventType,
      payload
    }
  });
  
  // Émettre l'événement au niveau du document
  document.dispatchEvent(event);
};

/**
 * S'abonne à un événement personnalisé
 * @param eventType Type d'événement à écouter
 * @param callback Fonction à appeler lorsque l'événement est émis
 * @returns Fonction pour se désabonner de l'événement
 */
export const onEvent = (eventType: AppEventType, callback: (payload?: any) => void): () => void => {
  // Fonction de gestion de l'événement
  const handleEvent = (event: CustomEvent<AppEventData>) => {
    if (event.detail.type === eventType) {
      callback(event.detail.payload);
    }
  };
  
  // Ajouter l'écouteur d'événement
  document.addEventListener('app-event', handleEvent as EventListener);
  
  // Retourner une fonction pour supprimer l'écouteur
  return () => {
    document.removeEventListener('app-event', handleEvent as EventListener);
  };
};
