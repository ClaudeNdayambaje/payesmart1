import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, setDoc } from 'firebase/firestore';
import { LoyaltyCard, LoyaltyTier } from '../types';
import { getCurrentBusinessId } from './businessService';

const LOYALTY_CARDS_COLLECTION = 'loyalty_cards';
const LOYALTY_TIERS_COLLECTION = 'loyalty_tiers';

/**
 * Convertit un objet LoyaltyCard pour Firestore (dates -> timestamps)
 */
const prepareCardForFirestore = (card: Partial<LoyaltyCard>): any => {
  const cardData = { ...card };
  
  // Convertir les dates en timestamps
  if (cardData.createdAt && cardData.createdAt instanceof Date) {
    cardData.createdAt = Timestamp.fromDate(cardData.createdAt);
  }
  if (cardData.lastUsed && cardData.lastUsed instanceof Date) {
    cardData.lastUsed = Timestamp.fromDate(cardData.lastUsed);
  }
  
  return cardData;
};

/**
 * Convertit un document Firestore en objet LoyaltyCard (timestamps -> dates)
 */
const convertCardFromFirestore = (doc: any): LoyaltyCard => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt.toDate(),
    lastUsed: data.lastUsed?.toDate()
  } as LoyaltyCard;
};

/**
 * Récupère toutes les cartes de fidélité depuis Firestore pour l'entreprise actuelle
 */
export const getLoyaltyCards = async (): Promise<LoyaltyCard[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour filtrer les cartes de fidélité');
      return [];
    }
    
    const cardsCollection = collection(db, LOYALTY_CARDS_COLLECTION);
    const q = query(cardsCollection, where("businessId", "==", businessId));
    const cardsSnapshot = await getDocs(q);
    
    return cardsSnapshot.docs.map(convertCardFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes de fidélité:', error);
    return [];
  }
};

/**
 * Récupère une carte de fidélité par son ID
 */
export const getLoyaltyCardById = async (cardId: string): Promise<LoyaltyCard | null> => {
  try {
    const cardRef = doc(db, LOYALTY_CARDS_COLLECTION, cardId);
    const cardSnap = await getDoc(cardRef);
    
    if (cardSnap.exists()) {
      return convertCardFromFirestore(cardSnap);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la carte de fidélité ${cardId}:`, error);
    return null;
  }
};

/**
 * Récupère une carte de fidélité par son numéro pour l'entreprise actuelle
 */
export const getLoyaltyCardByNumber = async (cardNumber: string): Promise<LoyaltyCard | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour filtrer les cartes de fidélité');
      return null;
    }
    
    const cardsCollection = collection(db, LOYALTY_CARDS_COLLECTION);
    const q = query(
      cardsCollection, 
      where("number", "==", cardNumber),
      where("businessId", "==", businessId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return convertCardFromFirestore(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la carte de fidélité ${cardNumber}:`, error);
    return null;
  }
};

/**
 * Ajoute une nouvelle carte de fidélité pour l'entreprise actuelle
 */
export const addLoyaltyCard = async (card: Omit<LoyaltyCard, 'id' | 'businessId'>): Promise<LoyaltyCard | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour ajouter la carte de fidélité');
      return null;
    }
    
    // Ajouter le businessId à la carte
    const cardWithBusinessId = { ...card, businessId };
    
    // Préparer les données pour Firestore
    const cardData = prepareCardForFirestore(cardWithBusinessId);
    
    // Ajouter la carte à Firestore
    const docRef = await addDoc(collection(db, LOYALTY_CARDS_COLLECTION), cardData);
    
    // Récupérer la carte créée avec son ID
    const newCard = await getDoc(docRef);
    if (newCard.exists()) {
      return {
        ...convertCardFromFirestore(newCard)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la carte de fidélité:', error);
    return null;
  }
};

/**
 * Supprime une carte de fidélité pour l'entreprise actuelle
 */
export const deleteLoyaltyCard = async (cardId: string): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour supprimer la carte de fidélité');
      return false;
    }
    
    const cardRef = doc(db, LOYALTY_CARDS_COLLECTION, cardId);
    const cardSnap = await getDoc(cardRef);
    
    if (!cardSnap.exists()) {
      console.error(`Carte de fidélité ${cardId} non trouvée`);
      return false;
    }
    
    // Vérifier que la carte appartient à l'entreprise actuelle
    const existingCardData = cardSnap.data();
    if (existingCardData.businessId !== businessId) {
      console.error(`La carte de fidélité ${cardId} n'appartient pas à l'entreprise actuelle`);
      return false;
    }
    
    await deleteDoc(cardRef);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la carte de fidélité ${cardId}:`, error);
    return false;
  }
};

/**
 * Met à jour une carte de fidélité existante pour l'entreprise actuelle
 */
export const updateLoyaltyCard = async (cardId: string, cardData: Partial<LoyaltyCard>): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour mettre à jour la carte de fidélité');
      return false;
    }
    
    const cardRef = doc(db, LOYALTY_CARDS_COLLECTION, cardId);
    const cardSnap = await getDoc(cardRef);
    
    if (!cardSnap.exists()) {
      console.error(`Carte de fidélité ${cardId} non trouvée`);
      return false;
    }
    
    // Vérifier que la carte appartient à l'entreprise actuelle
    const existingCardData = cardSnap.data();
    if (existingCardData.businessId !== businessId) {
      console.error(`La carte de fidélité ${cardId} n'appartient pas à l'entreprise actuelle`);
      return false;
    }
    
    // Supprimer businessId des données à mettre à jour pour éviter de le modifier
    const updateData = { ...cardData };
    delete updateData.businessId;
    
    // Préparer les données pour Firestore
    const updatedData = prepareCardForFirestore(updateData);
    
    // Mettre à jour la carte
    await updateDoc(cardRef, updatedData);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la carte de fidélité ${cardId}:`, error);
    return false;
  }
};

/**
 * Ajoute des points à une carte de fidélité
 */
export const addPointsToCard = async (cardId: string, pointsToAdd: number): Promise<boolean> => {
  try {
    const card = await getLoyaltyCardById(cardId);
    if (!card) {
      return false;
    }
    
    const newPoints = card.points + pointsToAdd;
    const newTier = await determineCardTier(newPoints);
    
    return await updateLoyaltyCard(cardId, {
      points: newPoints,
      tier: newTier,
      lastUsed: new Date()
    });
  } catch (error) {
    console.error(`Erreur lors de l'ajout de points à la carte ${cardId}:`, error);
    return false;
  }
};

/**
 * Récupère tous les niveaux de fidélité depuis Firestore pour l'entreprise actuelle
 */
export const getLoyaltyTiers = async (): Promise<LoyaltyTier[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour récupérer les niveaux de fidélité');
      return [];
    }
    
    const tiersCollection = collection(db, LOYALTY_TIERS_COLLECTION);
    const q = query(tiersCollection, where("businessId", "==", businessId));
    const tiersSnapshot = await getDocs(q);
    
    if (tiersSnapshot.empty) {
      // Si aucun niveau n'existe, créer les niveaux par défaut pour cette entreprise
      return await createDefaultLoyaltyTiers(businessId);
    }
    
    return tiersSnapshot.docs.map(doc => ({
      ...doc.data(),
      name: doc.id
    })) as LoyaltyTier[];
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux de fidélité:', error);
    return [];
  }
};

/**
 * Crée les niveaux de fidélité par défaut pour une entreprise
 */
const createDefaultLoyaltyTiers = async (businessId: string): Promise<LoyaltyTier[]> => {
  try {
    const defaultTiers = [
      { name: 'bronze' as const, minimumPoints: 0, discountPercentage: 0, pointsMultiplier: 1, color: '#CD7F32', businessId },
      { name: 'silver' as const, minimumPoints: 100, discountPercentage: 5, pointsMultiplier: 1.2, color: '#C0C0C0', businessId },
      { name: 'gold' as const, minimumPoints: 500, discountPercentage: 10, pointsMultiplier: 1.5, color: '#FFD700', businessId },
      { name: 'platinum' as const, minimumPoints: 1000, discountPercentage: 15, pointsMultiplier: 2, color: '#E5E4E2', businessId }
    ] as LoyaltyTier[];
    
    // Ajouter chaque niveau à Firestore
    for (const tier of defaultTiers) {
      const tierRef = doc(db, LOYALTY_TIERS_COLLECTION, tier.name);
      await setDoc(tierRef, tier);
    }
    
    return defaultTiers;
  } catch (error) {
    console.error('Erreur lors de la création des niveaux de fidélité par défaut:', error);
    return [];
  }
};

/**
 * Détermine le niveau de fidélité en fonction des points
 */
/**
 * Fonction de migration pour ajouter le champ businessId aux cartes de fidélité existantes
 */
export const migrateLoyaltyCardsToBusinessId = async (): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé pour la migration');
      return false;
    }
    
    // Récupérer toutes les cartes sans filtre businessId
    const cardsCollection = collection(db, LOYALTY_CARDS_COLLECTION);
    const cardsSnapshot = await getDocs(cardsCollection);
    
    if (cardsSnapshot.empty) {
      console.log('Aucune carte à migrer');
      return true;
    }
    
    let migratedCount = 0;
    
    // Mettre à jour chaque carte pour ajouter le businessId
    for (const cardDoc of cardsSnapshot.docs) {
      const cardData = cardDoc.data();
      
      // Vérifier si la carte a déjà un businessId
      if (!cardData.businessId) {
        // Ajouter le businessId à la carte
        await updateDoc(doc(db, LOYALTY_CARDS_COLLECTION, cardDoc.id), {
          businessId: businessId
        });
        migratedCount++;
      }
    }
    
    console.log(`Migration terminée: ${migratedCount} cartes migrées`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la migration des cartes de fidélité:', error);
    return false;
  }
};

/**
 * Détermine le niveau de fidélité en fonction des points
 */
export const determineCardTier = async (points: number): Promise<'bronze' | 'silver' | 'gold' | 'platinum'> => {
  try {
    const tiers = await getLoyaltyTiers();
    
    // Trier les niveaux par ordre décroissant de points minimum
    const sortedTiers = tiers.sort((a, b) => b.minimumPoints - a.minimumPoints);
    
    // Trouver le premier niveau dont les points minimum sont inférieurs ou égaux aux points de la carte
    for (const tier of sortedTiers) {
      if (points >= tier.minimumPoints) {
        return tier.name as 'bronze' | 'silver' | 'gold' | 'platinum';
      }
    }
    
    // Par défaut, retourner 'bronze'
    return 'bronze';
  } catch (error) {
    console.error('Erreur lors de la détermination du niveau de fidélité:', error);
    return 'bronze';
  }
};
