// Script de débogage pour le basculement du thème
// À inclure dans le projet pour diagnostiquer les problèmes de basculement jour/nuit

(function() {
  console.log('Script de débogage du thème chargé');
  
  // Observer les changements sur l'élément HTML
  const html = document.documentElement;
  
  // Surveiller les modifications de la classe sur l'élément HTML
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = html.classList.contains('dark');
        console.log(`Classe 'dark' ${isDark ? 'ajoutée' : 'supprimée'} sur l'élément HTML`);
      }
    });
  });
  
  // Configurer l'observateur
  observer.observe(html, { attributes: true });
  
  // Fonction pour basculer manuellement le thème (peut être appelée depuis la console)
  window.toggleThemeManually = function() {
    console.log('Tentative de basculement manuel du thème');
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Mode clair activé manuellement');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Mode sombre activé manuellement');
    }
  };
  
  // Fonction pour vérifier l'état actuel du thème
  window.checkThemeState = function() {
    const isDark = html.classList.contains('dark');
    const storedTheme = localStorage.getItem('theme');
    console.log(`État actuel du thème:
    - Classe 'dark' sur HTML: ${isDark ? 'Présente' : 'Absente'}
    - Thème stocké dans localStorage: ${storedTheme || 'Non défini'}
    - Préférence système: ${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Mode sombre' : 'Mode clair'}`);
    return {
      htmlHasDarkClass: isDark,
      storedTheme,
      systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
  };
  
  // Réparer le thème si nécessaire
  window.fixTheme = function(forceDark) {
    const shouldBeDark = forceDark !== undefined 
      ? forceDark 
      : (localStorage.getItem('theme') === 'dark' || 
         (localStorage.getItem('theme') === null && 
          window.matchMedia('(prefers-color-scheme: dark)').matches));
    
    if (shouldBeDark && !html.classList.contains('dark')) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Correction: Mode sombre appliqué');
    } else if (!shouldBeDark && html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Correction: Mode clair appliqué');
    } else {
      console.log('Aucune correction nécessaire, le thème est cohérent');
    }
  };
  
  // Exécuter une vérification initiale
  window.checkThemeState();
  
  console.log('Utilitaires de débogage du thème chargés. Utilisez les fonctions suivantes dans la console:');
  console.log('- toggleThemeManually() : basculer manuellement le thème');
  console.log('- checkThemeState() : vérifier l\'état actuel du thème');
  console.log('- fixTheme(forceDark) : réparer les incohérences du thème');
})();
