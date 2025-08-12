import '../styles/dialog.css';

type DialogType = 'info' | 'warning' | 'danger' | 'success';

/**
 * Affiche une boîte de dialogue de confirmation personnalisée et élégante
 * 
 * @param message Message à afficher
 * @param title Titre de la boîte de dialogue (optionnel)
 * @param confirmText Texte du bouton de confirmation (optionnel)
 * @param cancelText Texte du bouton d'annulation (optionnel)
 * @param type Type de dialogue - affecte la couleur (optionnel)
 * @returns Une promesse qui se résout avec true (confirmé) ou false (annulé)
 */
export function showConfirmDialog(
  message: string,
  title: string = 'Confirmation',
  confirmText: string = 'OK',
  cancelText: string = 'Annuler',
  type: DialogType = 'warning'
): Promise<boolean> {
  return new Promise((resolve) => {
    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    // Créer le conteneur de la boîte
    const container = document.createElement('div');
    container.className = 'dialog-container';
    
    // En-tête
    const header = document.createElement('div');
    header.className = 'dialog-header';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'dialog-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
    
    // Corps avec icône et message
    const body = document.createElement('div');
    body.className = 'dialog-body';
    
    const content = document.createElement('div');
    content.className = 'dialog-content';
    
    // Ajouter l'icône en fonction du type
    const icon = document.createElement('div');
    icon.className = `dialog-icon dialog-icon-${type}`;
    
    // Choisir l'icône SVG en fonction du type
    let iconSvg = '';
    switch (type) {
      case 'danger':
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
        `;
        break;
      case 'warning':
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" />
          </svg>
        `;
        break;
      case 'info':
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
        `;
        break;
      case 'success':
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
          </svg>
        `;
        break;
    }
    icon.innerHTML = iconSvg;
    content.appendChild(icon);
    
    // Message
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.flex = '1';
    content.appendChild(messageEl);
    
    body.appendChild(content);
    
    // Pied avec boutons
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    
    // Bouton Annuler
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.className = 'dialog-cancel-btn';
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    footer.appendChild(cancelBtn);
    
    // Bouton Confirmer
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `dialog-confirm-btn ${type}`;
    confirmBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    footer.appendChild(confirmBtn);
    
    // Assembler la boîte de dialogue
    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);
    
    // Ajouter au DOM
    document.body.appendChild(overlay);
    
    // Focus sur le bouton de confirmation pour l'accessibilité
    confirmBtn.focus();
  });
}

/**
 * Affiche une alerte élégante, remplaçant la fonction alert() native
 * 
 * @param message Message à afficher
 * @param title Titre optionnel 
 * @param type Type d'alerte (info, warning, error, success)
 * @param duration Durée d'affichage en millisecondes, 0 pour ne pas fermer automatiquement
 * @returns ID de l'alerte pour la fermer manuellement si nécessaire
 */
export function showAlert(
  message: string,
  title: string = '',
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  duration: number = 5000
): string {
  const id = 'alert-' + new Date().getTime();
  
  const alertEl = document.createElement('div');
  alertEl.className = `custom-alert ${type}`;
  alertEl.id = id;
  
  // Contenu de l'alerte
  let content = '';
  if (title) {
    content += `<strong>${title}</strong><br>`;
  }
  content += message;
  
  alertEl.innerHTML = `
    ${content}
    <button class="alert-close">&times;</button>
  `;
  
  // Gestionnaire pour fermer l'alerte
  const close = () => {
    if (document.body.contains(alertEl)) {
      alertEl.style.opacity = '0';
      alertEl.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(alertEl)) {
          document.body.removeChild(alertEl);
        }
      }, 300);
    }
  };
  
  // Ajouter au DOM
  document.body.appendChild(alertEl);
  
  // Configurer le bouton de fermeture
  const closeBtn = alertEl.querySelector('.alert-close');
  if (closeBtn) {
    (closeBtn as HTMLElement).onclick = close;
  }
  
  // Fermeture automatique si durée > 0
  if (duration > 0) {
    setTimeout(close, duration);
  }
  
  return id;
}

/**
 * Ferme une alerte par son ID
 */
export function closeAlert(id: string): void {
  const alert = document.getElementById(id);
  if (alert) {
    alert.style.opacity = '0';
    alert.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 300);
  }
}
