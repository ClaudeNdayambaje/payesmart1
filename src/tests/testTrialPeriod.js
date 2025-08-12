// Script de test pour vérifier si la période d'essai active est correctement appliquée
import { getActiveTrialPeriod } from '../services/trialPeriodService';
import { syncBusinessToSaasClient } from '../services/saasClientService';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Fonction de test principale
async function testTrialPeriodApplication() {
  try {
    console.log('=== TEST DE LA PÉRIODE D\'ESSAI ACTIVE ===');
    
    // 1. Récupérer la période d'essai active
    console.log('1. Récupération de la période d\'essai active...');
    const activePeriod = await getActiveTrialPeriod();
    console.log('Période active:', activePeriod ? activePeriod.name : 'Aucune période active trouvée');
    
    if (!activePeriod) {
      console.error('ERREUR: Aucune période d\'essai active trouvée. Veuillez configurer une période d\'essai active.');
      return;
    }
    
    // 2. Simuler la création d'un client avec un ID de test
    const testBusinessId = `test_${Date.now()}`;
    console.log(`2. Simulation de la création d'un client avec l'ID: ${testBusinessId}...`);
    
    // Créer un document business fictif dans Firestore pour le test
    await setDoc(doc(db, 'businesses', testBusinessId), {
      businessName: 'Entreprise Test',
      ownerFirstName: 'Prénom',
      ownerLastName: 'Nom',
      email: 'test@example.com',
      phone: '0123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: 'free',
      active: true
    });
    
    console.log('Document business créé pour le test.');
    
    // 3. Appeler la fonction syncBusinessToSaasClient
    console.log('3. Synchronisation avec le système SaaS...');
    await syncBusinessToSaasClient(testBusinessId);
    
    // 4. Vérifier si le client a été créé avec la bonne période d'essai
    console.log('4. Vérification de la période d\'essai appliquée...');
    
    const clientsQuery = query(
      collection(db, 'saas_clients'),
      where('businessId', '==', testBusinessId)
    );
    
    const clientsSnapshot = await getDocs(clientsQuery);
    
    if (clientsSnapshot.empty) {
      console.error('ERREUR: Aucun client SaaS n\'a été créé.');
      return;
    }
    
    const clientData = clientsSnapshot.docs[0].data();
    console.log('Client SaaS créé avec succès:');
    console.log('- Nom de l\'entreprise:', clientData.businessName);
    console.log('- Date de début de la période d\'essai:', new Date(clientData.trialStartDate).toLocaleString());
    console.log('- Date de fin de la période d\'essai:', new Date(clientData.trialEndDate).toLocaleString());
    
    if (clientData.trialInfo) {
      console.log('- Informations sur la période d\'essai:');
      console.log('  * ID de la période:', clientData.trialInfo.trialPeriodId);
      console.log('  * Nom de la période:', clientData.trialInfo.trialPeriodName);
      console.log('  * Durée (jours):', clientData.trialInfo.durationDays);
      console.log('  * Durée (minutes):', clientData.trialInfo.durationMinutes);
      
      // Vérifier si la période d'essai appliquée correspond à la période active
      if (clientData.trialInfo.trialPeriodId === activePeriod.id) {
        console.log('\n✅ TEST RÉUSSI: La période d\'essai active a été correctement appliquée au client.');
      } else {
        console.error('\n❌ TEST ÉCHOUÉ: La période d\'essai appliquée ne correspond pas à la période active.');
      }
    } else {
      console.error('\n❌ TEST ÉCHOUÉ: Les informations de période d\'essai sont manquantes.');
    }
    
    // 5. Nettoyer les données de test
    console.log('\n5. Nettoyage des données de test...');
    
    // Supprimer le client SaaS
    await deleteDoc(doc(db, 'saas_clients', clientsSnapshot.docs[0].id));
    
    // Supprimer le document business
    await deleteDoc(doc(db, 'businesses', testBusinessId));
    
    console.log('Données de test supprimées avec succès.');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécuter le test
testTrialPeriodApplication();
