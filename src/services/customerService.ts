import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { LoyaltyCard } from '../types';
import { Client } from '../types/saas';

const LOYALTY_CARDS_COLLECTION = 'loyalty_cards';

/**
 * Convertit une carte de fidélité en objet Client pour l'affichage dans la liste des clients
 */
const loyaltyCardToClient = (card: LoyaltyCard): Client => {
  return {
    id: card.id,
    businessName: '',  // Les clients individuels n'ont pas de nom d'entreprise
    contactName: card.customerName,
    email: card.email,
    phone: card.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    createdAt: card.createdAt.getTime(),
    status: 'active',
    notes: `Carte de fidélité: ${card.number} - Points: ${card.points}`,
    businessId: card.businessId,
    isInTrial: false
  };
};

/**
 * Récupère tous les clients (cartes de fidélité) depuis Firestore
 */
export const getCustomers = async (): Promise<Client[]> => {
  try {
    console.log('🔍 Récupération des clients depuis les cartes de fidélité...');
    
    // Créer la requête pour récupérer les cartes de fidélité
    const cardsCollection = collection(db, LOYALTY_CARDS_COLLECTION);
    const cardsQuery = query(cardsCollection, orderBy('customerName', 'asc'));
    
    console.log('⏳ Exécution de la requête...');
    const cardsSnapshot = await getDocs(cardsQuery);
    console.log(`✅ Requête exécutée - Nombre de clients trouvés: ${cardsSnapshot.size}`);
    
    // Vérifier les résultats
    if (cardsSnapshot.size === 0) {
      console.log('⚠️ Aucun client trouvé dans la collection:', LOYALTY_CARDS_COLLECTION);
      
      // Créer des clients de test si aucun n'est trouvé
      console.log('🔄 Création de clients de test par défaut...');
      const defaultClients: Client[] = [
        {
          id: 'default1',
          businessName: '',
          contactName: 'Pierre Durand',
          email: 'pierre.durand@example.com',
          phone: '0345678901',
          address: '123 Rue Principale',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          createdAt: Date.now(),
          status: 'active',
          notes: 'Carte de fidélité: 1001 - Points: 250',
          businessId: 'business1',
          isInTrial: false
        },
        {
          id: 'default2',
          businessName: '',
          contactName: 'Marie Martin',
          email: 'marie.martin@example.com',
          phone: '0234567890',
          address: '45 Avenue des Champs',
          city: 'Lyon',
          postalCode: '69001',
          country: 'France',
          createdAt: Date.now(),
          status: 'active',
          notes: 'Carte de fidélité: 1002 - Points: 150',
          businessId: 'business1',
          isInTrial: false
        },
        {
          id: 'default3',
          businessName: '',
          contactName: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          phone: '0123456789',
          address: '78 Rue du Commerce',
          city: 'Marseille',
          postalCode: '13001',
          country: 'France',
          createdAt: Date.now(),
          status: 'active',
          notes: 'Carte de fidélité: 1003 - Points: 75',
          businessId: 'business1',
          isInTrial: false
        }
      ];
      
      console.log('👥 Clients de test créés en mémoire:', defaultClients.length);
      return defaultClients;
    }
    
    // Transformer les cartes de fidélité en objets Client
    console.log('🔄 Transformation des cartes de fidélité en clients...');
    const clients = cardsSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📝 Traitement du client ${doc.id}: ${data.customerName}`);
      
      // Créer l'objet LoyaltyCard
      const card: LoyaltyCard = {
        id: doc.id,
        number: data.number,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone || '',
        points: data.points,
        tier: data.tier,
        createdAt: data.createdAt.toDate(),
        lastUsed: data.lastUsed?.toDate(),
        businessId: data.businessId
      };
      
      // Convertir en Client
      return loyaltyCardToClient(card);
    });
    
    console.log(`✅ ${clients.length} clients récupérés avec succès`);
    return clients;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des clients:', error);
    
    // En cas d'erreur, retourner des clients de test par défaut
    console.log('🔄 Retour de clients de test par défaut en cas d\'erreur...');
    return [
      {
        id: 'error1',
        businessName: '',
        contactName: 'Client Test (Erreur)',
        email: 'client@example.com',
        phone: '0000000000',
        address: '1 Rue de Secours',
        city: 'Paris',
        postalCode: '75000',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Carte de fidélité: 9999 - Points: 0',
        businessId: 'business1',
        isInTrial: false
      }
    ];
  }
};
