import { db } from '../firebase';
import { collection, addDoc, query, getDocs } from 'firebase/firestore';
import { Client } from '../types/saas';

// Vérifier la structure du type Client pour les champs trialStartDate et trialEndDate
type ClientWithOptionalTrialDates = Omit<Client, 'trialStartDate' | 'trialEndDate'> & {
  trialStartDate: number | undefined;
  trialEndDate: number | undefined;
};

// Collection Firestore
const SAAS_CLIENTS_COLLECTION = 'saas_clients';

/**
 * Crée des clients de test dans la base de données
 */
export const seedTestClients = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Vérifier si des clients existent déjà
    const clientsQuery = query(collection(db, SAAS_CLIENTS_COLLECTION));
    const snapshot = await getDocs(clientsQuery);
    
    if (snapshot.size > 0) {
      return { 
        success: true, 
        message: `${snapshot.size} clients existent déjà dans la base de données.` 
      };
    }
    
    // Liste des clients de test à créer
    const testClients: Omit<ClientWithOptionalTrialDates, 'id'>[] = [
      {
        businessName: 'Boulangerie Dupont',
        contactName: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        phone: '0123456789',
        address: '15 rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Client de test',
        businessId: 'business1',
        trialStartDate: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 jours dans le passé
        trialEndDate: Date.now() + (10 * 24 * 60 * 60 * 1000), // 10 jours dans le futur
        isInTrial: true
      },
      {
        businessName: 'Restaurant Le Gourmet',
        contactName: 'Marie Martin',
        email: 'marie.martin@example.com',
        phone: '0234567890',
        address: '25 avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Client de test',
        businessId: 'business2',
        trialStartDate: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 jours dans le passé
        trialEndDate: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 jours dans le futur
        isInTrial: true
      },
      {
        businessName: 'Épicerie Bio Verte',
        contactName: 'Pierre Durand',
        email: 'pierre.durand@example.com',
        phone: '0345678901',
        address: '8 rue de la République',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Client de test',
        businessId: 'business3',
        trialStartDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 jours dans le passé
        trialEndDate: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 jour dans le passé (essai terminé)
        isInTrial: false
      },
      {
        businessName: 'Librairie Culturelle',
        contactName: 'Sophie Bernard',
        email: 'sophie.bernard@example.com',
        phone: '0456789012',
        address: '12 place Bellecour',
        city: 'Lyon',
        postalCode: '69002',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Client de test',
        businessId: 'business4',
        trialStartDate: undefined,
        trialEndDate: undefined,
        isInTrial: false
      },
      {
        businessName: 'Boutique Mode Élégance',
        contactName: 'Luc Petit',
        email: 'luc.petit@example.com',
        phone: '0567890123',
        address: '5 rue Paradis',
        city: 'Marseille',
        postalCode: '13001',
        country: 'France',
        createdAt: Date.now(),
        status: 'active',
        notes: 'Client de test',
        businessId: 'business5',
        trialStartDate: undefined,
        trialEndDate: undefined,
        isInTrial: false
      }
    ];
    
    // Ajouter les clients à la base de données
    let addedCount = 0;
    for (const client of testClients) {
      await addDoc(collection(db, SAAS_CLIENTS_COLLECTION), client);
      addedCount++;
    }
    
    return { 
      success: true, 
      message: `${addedCount} clients de test ont été créés avec succès.` 
    };
  } catch (error) {
    console.error('Erreur lors de la création des clients de test:', error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
