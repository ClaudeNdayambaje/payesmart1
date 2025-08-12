import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Business } from '../types';

const BUSINESSES_COLLECTION = 'businesses';

/**
 * Récupère toutes les entreprises (clients PayeSmart)
 */
// Données de démonstration pour les entreprises
const DEMO_BUSINESSES: Business[] = [
  {
    id: 'client1',
    businessName: 'Proximus Shop',
    ownerFirstName: 'Aubain',
    ownerLastName: 'Minaku',
    email: 'am@proximus.be',
    phone: '0456788987',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    plan: 'premium',
    active: true,
    address: { street: '123 Avenue Louise', city: 'Bruxelles', postalCode: '1000', country: 'Belgique' },
    settings: { currency: 'EUR', language: 'fr', timezone: 'Europe/Brussels' }
  },
  {
    id: 'client2',
    businessName: 'Saloon-Goma',
    ownerFirstName: 'Octave',
    ownerLastName: 'Gashugi',
    email: 'og@saloon.cd',
    phone: '0545667788',
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-02-15'),
    plan: 'premium',
    active: true,
    address: { street: '45 Boulevard du 30 Juin', city: 'Goma', postalCode: '00000', country: 'RDC' },
    settings: { currency: 'USD', language: 'fr', timezone: 'Africa/Kinshasa' }
  },
  {
    id: 'client3',
    businessName: 'Test',
    ownerFirstName: 'Opopo',
    ownerLastName: 'MOPOPO',
    email: 'cn@test.co',
    phone: '0999999999',
    createdAt: new Date('2025-03-10'),
    updatedAt: new Date('2025-03-10'),
    plan: 'basic',
    active: true,
    address: { street: '789 Test Street', city: 'Test City', postalCode: '12345', country: 'Test Country' },
    settings: { currency: 'EUR', language: 'fr', timezone: 'Europe/Paris' }
  },
  {
    id: 'client4',
    businessName: 'pp sprl',
    ownerFirstName: 'pp',
    ownerLastName: 'pp',
    email: 'pp@pp.pp',
    phone: '345678',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    plan: 'basic',
    active: true,
    address: { street: '123 pp Street', city: 'pp City', postalCode: '12345', country: 'pp Country' },
    settings: { currency: 'EUR', language: 'fr', timezone: 'Europe/Paris' }
  },
  {
    id: 'client5',
    businessName: 'fff sprl',
    ownerFirstName: 'fff',
    ownerLastName: 'fff',
    email: 'ff@ff.ff',
    phone: '7654',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    plan: 'premium',
    active: true,
    address: { street: '123 fff Street', city: 'fff City', postalCode: '12345', country: 'fff Country' },
    settings: { currency: 'EUR', language: 'fr', timezone: 'Europe/Paris' }
  }
];

export const getAllBusinesses = async (): Promise<Business[]> => {
  try {
    console.log('🔍 Récupération des entreprises depuis Firestore...');
    console.log('📁 Collection utilisée:', BUSINESSES_COLLECTION);
    
    // Essayer d'abord de récupérer depuis Firebase
    try {
      // Vérifier si la collection existe
      const collectionRef = collection(db, BUSINESSES_COLLECTION);
      console.log('📋 Référence de collection créée');
      
      // Créer la requête - utiliser 'name' au lieu de 'businessName' car c'est le champ réel dans Firebase
      const businessesQuery = query(
        collectionRef
        // Ne pas utiliser orderBy pour l'instant pour s'assurer que tous les documents sont récupérés
      );
      console.log('🔎 Requête créée sans filtre pour récupérer tous les documents');
      
      // Exécuter la requête
      console.log('⏳ Exécution de la requête...');
      const snapshot = await getDocs(businessesQuery);
      console.log(`✅ Requête exécutée - Nombre d'entreprises trouvées: ${snapshot.size}`);
      
      // Si des données sont trouvées, les retourner
      if (snapshot.size > 0) {
        const businesses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Business));
        console.log('Entreprises récupérées depuis Firebase:', businesses.length);
        return businesses;
      }
    } catch (firebaseError) {
      console.warn('Erreur Firebase, utilisation des données de démonstration pour les entreprises:', firebaseError);
    }
    
    // Si aucune donnée n'est trouvée ou en cas d'erreur, utiliser les données de démonstration
    console.log('💡 Utilisation des données de démonstration pour les entreprises');
    return DEMO_BUSINESSES;
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    // En cas d'erreur générale, retourner quand même les données de démonstration
    return DEMO_BUSINESSES;
  }
};

/**
 * Récupère les entreprises actives uniquement
 */
export const getActiveBusinesses = async (): Promise<Business[]> => {
  try {
    const businessesQuery = query(
      collection(db, BUSINESSES_COLLECTION),
      where('active', '==', true),
      orderBy('businessName', 'asc')
    );
    
    const snapshot = await getDocs(businessesQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const business: Business = {
        id: doc.id,
        businessName: data.businessName || 'Sans nom',
        ownerFirstName: data.ownerFirstName || '',
        ownerLastName: data.ownerLastName || '',
        email: data.email || '',
        phone: data.phone || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        plan: data.plan || 'free',
        active: true,
        logo: data.logo || undefined,
        address: data.address || undefined,
        settings: data.settings || {
          currency: 'EUR',
          language: 'fr',
          timezone: 'Europe/Paris'
        }
      };
      return business;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises actives:', error);
    return [];
  }
};
