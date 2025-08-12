import React from 'react';
import { createRoot } from 'react-dom/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * Affiche une boîte de dialogue de confirmation moderne et esthétique
 * @param message Message à afficher
 * @param title Titre de la boîte de dialogue (optionnel)
 * @param confirmText Texte du bouton de confirmation (optionnel)
 * @param cancelText Texte du bouton d'annulation (optionnel)
 * @param type Type de la boîte de dialogue: 'danger', 'warning', 'info', 'success' (optionnel)
 * @returns Une promesse qui se résout avec true si confirmé, false sinon
 */
export const showConfirm = (
  message: string,
  title: string = 'Confirmation',
  confirmText: string = 'OK',
  cancelText: string = 'Annuler',
  type: 'danger' | 'warning' | 'info' | 'success' = 'warning'
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Créer un élément div pour le portail
    const containerElement = document.createElement('div');
    containerElement.className = 'fixed-confirm-dialog';
    document.body.appendChild(containerElement);
    
    // Créer la racine React
    const root = createRoot(containerElement);
    
    // Fonction pour nettoyer le portail
    const cleanup = () => {
      root.unmount();
      if (document.body.contains(containerElement)) {
        document.body.removeChild(containerElement);
      }
    };
    
    // Forcer la mise à jour du thème
    const event = new CustomEvent('forceThemeUpdate');
    window.dispatchEvent(event);
    
    // Rendre le composant ConfirmDialog
    root.render(
      <ConfirmDialog
        isOpen={true}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        type={type}
        onConfirm={() => {
          resolve(true);
          cleanup();
        }}
        onCancel={() => {
          resolve(false);
          cleanup();
        }}
      />
    );
  });
};
