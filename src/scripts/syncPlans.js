// Script pour synchroniser manuellement les plans d'abonnement
import { syncSubscriptionPlansWithUI } from '../utils/syncSubscriptionPlansWithUI.js';

console.log('Démarrage de la synchronisation des plans d\'abonnement...');

syncSubscriptionPlansWithUI()
  .then(() => {
    console.log('Synchronisation des plans terminée avec succès !');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur lors de la synchronisation :', err);
    process.exit(1);
  });
