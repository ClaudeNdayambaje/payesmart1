// Script pour configurer automatiquement une période d'essai active
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Collection Firestore pour les configurations de périodes d'essai
const TRIAL_CONFIG_COLLECTION = 'trial_configs';

// Fonction pour configurer une période d'essai active
async function configurerPeriodeEssai() {
  try {
    console.log('=== CONFIGURATION DE LA PÉRIODE D\'ESSAI ACTIVE ===');
    
    // Identifiant de l'administrateur système (utilisé comme ID du document de configuration)
    const adminId = 'admin';
    
    // Créer une configuration de périodes d'essai
    const configurationPeriodes = {
      enableTrials: true,
      activeTrialId: '1', // ID de la période d'essai active
      trialPeriods: [
        {
          id: '1',
          name: 'Période d\'essai standard',
          days: 14,
          minutes: 0,
          isActive: true,
          createdAt: new Date(),
          description: 'Période d\'essai standard de 14 jours'
        },
        {
          id: '2',
          name: 'Période d\'essai courte',
          days: 7,
          minutes: 0,
          isActive: false,
          createdAt: new Date(),
          description: 'Période d\'essai courte de 7 jours'
        },
        {
          id: '3',
          name: 'Période d\'essai longue',
          days: 30,
          minutes: 0,
          isActive: false,
          createdAt: new Date(),
          description: 'Période d\'essai longue de 30 jours'
        }
      ]
    };
    
    // Enregistrer la configuration dans Firestore
    const configRef = doc(db, TRIAL_CONFIG_COLLECTION, adminId);
    await setDoc(configRef, configurationPeriodes);
    
    console.log('Configuration de la période d\'essai enregistrée avec succès!');
    console.log('Période active: Période d\'essai standard (14 jours)');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration de la période d\'essai:', error);
    return false;
  }
}

// Exécuter la configuration
configurerPeriodeEssai().then(success => {
  if (success) {
    console.log('La période d\'essai a été configurée avec succès. Les nouveaux clients auront maintenant une période d\'essai de 14 jours.');
  } else {
    console.log('Échec de la configuration de la période d\'essai.');
  }
});
