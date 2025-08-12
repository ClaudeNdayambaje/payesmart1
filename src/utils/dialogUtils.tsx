import { createRoot } from 'react-dom/client';
import React from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * Affiche une boîte de dialogue de confirmation personnalisée
 * @param message Message à afficher dans la boîte de dialogue
 * @param title Titre de la boîte de dialogue
 * @param confirmText Texte du bouton de confirmation
 * @param cancelText Texte du bouton d'annulation
 * @param type Type de confirmation (danger, warning, info)
 * @returns Promise qui se résout par true si confirmé, false sinon
 */
export const showConfirmDialog = (
  message: string,
  title: string = 'Confirmation',
  confirmText: string = 'Confirmer',
  cancelText: string = 'Annuler',
  type: 'danger' | 'warning' | 'info' = 'danger'
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Créer un élément div pour monter le composant React
    const containerElement = document.createElement('div');
    document.body.appendChild(containerElement);
    
    // Créer un root React dans le conteneur
    const root = createRoot(containerElement);
    
    // Fonction pour nettoyer et résoudre
    const cleanUp = (result: boolean) => {
      root.unmount();
      document.body.removeChild(containerElement);
      resolve(result);
    };
    
    // Monter le composant ConfirmDialog
    root.render(
      <ConfirmDialog
        isOpen={true}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        type={type}
        onConfirm={() => cleanUp(true)}
        onCancel={() => cleanUp(false)}
      />
    );
  });
};

/**
 * Affiche une alerte personnalisée
 * @param message Message à afficher dans l'alerte
 * @param title Titre de l'alerte
 * @param type Type d'alerte (success, error, warning, info)
 * @param duration Durée d'affichage en millisecondes (5000ms par défaut)
 */
export const showAlert = (
  message: string,
  title: string = 'Alerte',
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration: number = 5000
): void => {
  // Créer l'élément d'alerte
  const alertElement = document.createElement('div');
  alertElement.className = 'custom-alert';
  
  // Déterminer la couleur de la bordure en fonction du type
  let borderColor = '';
  let icon = '';
  
  switch (type) {
    case 'success':
      borderColor = 'var(--theme-color-success, #10b981)';
      icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      break;
    case 'error':
      borderColor = 'var(--theme-color-danger, #ef4444)';
      icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      break;
    case 'warning':
      borderColor = 'var(--theme-color-warning, #f59e0b)';
      icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      break;
    case 'info':
    default:
      borderColor = 'var(--theme-color, #4f46e5)';
      icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      break;
  }
  
  alertElement.style.borderLeftColor = borderColor;
  
  // Ajouter le contenu HTML avec icône
  alertElement.innerHTML = `
    <div class="alert-icon">
      ${icon}
    </div>
    <div class="alert-content">
      <h4 class="alert-title">${title}</h4>
      <p class="alert-message">${message}</p>
    </div>
  `;
  
  // Ajouter l'alerte au document
  document.body.appendChild(alertElement);
  
  // Planifier le retrait de l'alerte après 5 secondes
  setTimeout(() => {
    alertElement.style.animation = 'slideOutAlert 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(alertElement)) {
        document.body.removeChild(alertElement);
      }
    }, 300);
  }, duration);
};

/**
 * Afficher une simple alerte au centre de l'écran
 * (Remplacement pour window.alert)
 */
export const showSimpleAlert = (message: string): void => {
  // Vérifier si nous sommes dans un navigateur
  if (typeof window === 'undefined') return;
  
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">Information</h3>
    </div>
    <div class="dialog-body">
      <p>${message}</p>
    </div>
    <div class="dialog-footer">
      <button class="dialog-confirm">OK</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  dialog.showModal();
  
  const confirmButton = dialog.querySelector('.dialog-confirm') as HTMLButtonElement;
  confirmButton.focus();
  confirmButton.onclick = () => {
    dialog.close();
    document.body.removeChild(dialog);
  };
};

