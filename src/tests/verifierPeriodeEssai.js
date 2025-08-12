// Script pour vérifier la période d'essai active
import { getActiveTrialPeriod, getTrialDurationParameters } from '../services/trialPeriodService';

async function verifierPeriodeEssai() {
  try {
    console.log('=== VÉRIFICATION DE LA PÉRIODE D\'ESSAI ACTIVE ===');
    
    // 1. Récupérer la période d'essai active
    console.log('1. Récupération de la période d\'essai active...');
    const activePeriod = await getActiveTrialPeriod();
    
    if (activePeriod) {
      console.log('Période active trouvée:');
      console.log('- ID:', activePeriod.id);
      console.log('- Nom:', activePeriod.name);
      console.log('- Jours:', activePeriod.days);
      console.log('- Minutes:', activePeriod.minutes);
    } else {
      console.log('Aucune période active trouvée.');
    }
    
    // 2. Récupérer les paramètres de durée
    console.log('\n2. Récupération des paramètres de durée...');
    const trialParams = await getTrialDurationParameters();
    console.log('Paramètres de durée:');
    console.log('- Jours:', trialParams.days);
    console.log('- Minutes:', trialParams.minutes);
    
    // 3. Calculer la durée en millisecondes
    const trialDurationMs = (trialParams.days * 24 * 60 * 60 * 1000) + (trialParams.minutes * 60 * 1000);
    const now = Date.now();
    const trialEndDate = new Date(now + trialDurationMs);
    
    console.log('\n3. Calcul de la période d\'essai:');
    console.log('- Date de début:', new Date(now).toLocaleString());
    console.log('- Date de fin:', trialEndDate.toLocaleString());
    console.log('- Durée en jours:', trialParams.days);
    
    console.log('\n=== VÉRIFICATION TERMINÉE ===');
    
    return {
      activePeriod,
      trialParams,
      startDate: new Date(now),
      endDate: trialEndDate
    };
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return null;
  }
}

// Exécuter la vérification
verifierPeriodeEssai().then(result => {
  if (result && result.activePeriod) {
    console.log('\nLa période d\'essai active sera appliquée automatiquement lors de la création d\'un compte.');
  } else {
    console.log('\nAttention: Aucune période d\'essai active n\'a été trouvée.');
  }
});
