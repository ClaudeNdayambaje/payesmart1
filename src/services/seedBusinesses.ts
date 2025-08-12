import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';

const BUSINESSES_COLLECTION = 'businesses';

/**
 * Crée des entreprises de test dans Firestore
 */
export const seedTestBusinesses = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Vérification des entreprises existantes...');
    const businessesQuery = query(collection(db, BUSINESSES_COLLECTION));
    const snapshot = await getDocs(businessesQuery);
    
    if (snapshot.size > 0) {
      console.log(`${snapshot.size} entreprises existent déjà dans Firestore.`);
      return { 
        success: true, 
        message: `${snapshot.size} entreprises existent déjà dans Firestore.` 
      };
    }
    
    console.log('Création des entreprises de test...');
    
    // Liste des entreprises à créer
    const testBusinesses = [
      {
        id: 'business1',
        businessName: 'Boulangerie Dupont',
        ownerFirstName: 'Jean',
        ownerLastName: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '0123456789',
        plan: 'free',
        active: true
      },
      {
        id: 'business2',
        businessName: 'Restaurant Le Gourmet',
        ownerFirstName: 'Marie',
        ownerLastName: 'Martin',
        email: 'marie.martin@example.com',
        phone: '0234567890',
        plan: 'basic',
        active: true
      },
      {
        id: 'business3',
        businessName: 'Épicerie Bio Verte',
        ownerFirstName: 'Pierre',
        ownerLastName: 'Durand',
        email: 'pierre.durand@example.com',
        phone: '0345678901',
        plan: 'premium',
        active: true
      },
      {
        id: 'business4',
        businessName: 'Librairie Culturelle',
        ownerFirstName: 'Sophie',
        ownerLastName: 'Bernard',
        email: 'sophie.bernard@example.com',
        phone: '0456789012',
        plan: 'basic',
        active: true
      },
      {
        id: 'business5',
        businessName: 'Boutique Mode Élégance',
        ownerFirstName: 'Luc',
        ownerLastName: 'Petit',
        email: 'luc.petit@example.com',
        phone: '0567890123',
        plan: 'free',
        active: true
      }
    ];
    
    // Ajouter les entreprises à Firestore
    let addedCount = 0;
    for (const business of testBusinesses) {
      const { id, ...businessData } = business;
      
      // Utiliser setDoc avec un ID spécifique
      await setDoc(doc(db, BUSINESSES_COLLECTION, id), {
        ...businessData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Entreprise créée: ${business.businessName}`);
      addedCount++;
    }
    
    console.log(`${addedCount} entreprises créées avec succès.`);
    return { 
      success: true, 
      message: `${addedCount} entreprises de test ont été créées avec succès.` 
    };
  } catch (error) {
    console.error('Erreur lors de la création des entreprises de test:', error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
