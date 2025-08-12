import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Configuration Firebase (identique à celle de votre application)
const firebaseConfig = {
  apiKey: "AIzaSyC1IgMgJJ41cMceM6JlTM0lxpxl7PA15v8",
  authDomain: "logiciel-de-caisse-7e58e.firebaseapp.com",
  databaseURL: "https://logiciel-de-caisse-7e58e.firebaseio.com",
  projectId: "logiciel-de-caisse-7e58e",
  storageBucket: "logiciel-de-caisse-7e58e.appspot.com",
  messagingSenderId: "355389033889",
  appId: "1:355389033889:web:da1334390695ede628efb5",
  measurementId: "G-LWEY16F6RK"
};

// ID de l'entreprise PaySmart
const PAYSMART_BUSINESS_ID = 'Hrk3nn1HVlcHOJ7InqK1';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Fonction qui met à jour tous les accessoires pour ajouter le champ businessId
 */
async function updateAccessoriesWithBusinessId() {
  try {
    console.log('📊 Début de la mise à jour des accessoires...');
    const accessoriesCollection = collection(db, 'accessoires');
    const snapshot = await getDocs(accessoriesCollection);
    
    console.log(`📋 Nombre total d'accessoires trouvés: ${snapshot.size}`);
    
    // Compteurs pour le suivi
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Traiter chaque document
    const updatePromises = [];
    
    snapshot.forEach(document => {
      const accessoryData = document.data();
      const accessoryId = document.id;
      
      // Vérifier si businessId existe déjà
      if (accessoryData.businessId === PAYSMART_BUSINESS_ID) {
        console.log(`⏭️ [${accessoryData.name || accessoryId}] : businessId déjà défini correctement`);
        skippedCount++;
        return;
      }
      
      // Préparer la mise à jour
      console.log(`🔄 [${accessoryData.name || accessoryId}] : Ajout du businessId`);
      
      const docRef = doc(db, 'accessoires', accessoryId);
      const updatePromise = updateDoc(docRef, {
        businessId: PAYSMART_BUSINESS_ID
      })
      .then(() => {
        console.log(`✅ [${accessoryData.name || accessoryId}] : Mise à jour réussie`);
        updatedCount++;
      })
      .catch(error => {
        console.error(`❌ [${accessoryData.name || accessoryId}] : Erreur lors de la mise à jour`, error);
        errorCount++;
      });
      
      updatePromises.push(updatePromise);
    });
    
    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises);
    
    console.log('\n📊 RÉSULTATS:');
    console.log(`✅ ${updatedCount} accessoires mis à jour avec businessId="${PAYSMART_BUSINESS_ID}"`);
    console.log(`⏭️ ${skippedCount} accessoires déjà corrects (ignorés)`);
    console.log(`❌ ${errorCount} erreurs rencontrées`);
    console.log('\n💡 Vous pouvez maintenant actualiser votre page d\'accessoires marketing pour voir les produits réels.');
    
  } catch (error) {
    console.error('🔴 ERREUR CRITIQUE lors de la mise à jour des accessoires:', error);
  }
}

// Exécuter la fonction principale
updateAccessoriesWithBusinessId();

