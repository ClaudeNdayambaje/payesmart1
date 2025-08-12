import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './AppRouter.tsx';
import './index.css';
import './styles/buttonHighlight.css'; // Importation des styles personnalisés pour les boutons
import './styles/dialog.css'; // Importation des styles pour les boîtes de dialogue améliorées
import './styles/custom-login.css'; // Importation des styles pour la page de connexion
import './styles/theme-fixes.css'; // Importation des correctifs pour le système de thème
import { initializeApplicationData } from './utils/initializeData';
import { ThemeProvider } from './contexts/ThemeContext';
import { handlePostLoginNavigation } from './utils/pageRefresh';

// Initialiser les données au démarrage de l'application
initializeApplicationData().catch(console.error);

// Gérer la navigation après connexion (thèmes, etc.)
handlePostLoginNavigation();

// Redirection vers la page d'accueil du site marketing uniquement si aucun fragment d'URL n'est présent
if ((window.location.pathname === '/' || window.location.pathname === '') && window.location.hash === '') {
  window.location.href = '/marketing/index.html';
}

// Si l'URL contient un fragment (#), nous permettons au routeur React de le gérer

// Script pour initialiser le thème avant le rendu complet
const initializeTheme = () => {
  // Vérifier d'abord les préférences utilisateur stockées
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    // L'utilisateur a explicitement choisi le mode sombre
    document.documentElement.classList.add('dark');
    console.log('Thème initialisé: mode sombre (préférence utilisateur)');
  } else if (savedTheme === 'light') {
    // L'utilisateur a explicitement choisi le mode clair
    document.documentElement.classList.remove('dark');
    console.log('Thème initialisé: mode clair (préférence utilisateur)');
  } else {
    // Aucune préférence enregistrée, utiliser les préférences système
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('Thème initialisé: mode sombre (préférence système)');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Thème initialisé: mode clair (préférence système)');
    }
  }
};

// Exécuter l'initialisation du thème
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </StrictMode>
);
