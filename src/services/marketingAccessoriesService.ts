import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

export interface MarketingAccessory {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  active: boolean | string;
  businessId: string;
  stock?: number;
  priority?: number;
  features?: string[];
  videoUrl?: string;
}

// Collection Firestore pour les accessoires marketing
const ACCESSORIES_COLLECTION = 'accessoires';

/**
 * Récupère tous les accessoires marketing depuis Firestore
 */
// ID de l'entreprise PaySmart pour filtrer les accessoires
const PAYSMART_BUSINESS_ID = 'Hrk3nn1HVlcHOJ7InqK1';

export const getMarketingAccessories = async (): Promise<MarketingAccessory[]> => {
  try {
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    
    // Filtrer par businessId pour avoir les mêmes accessoires que sur le site marketing
    const q = query(accessoriesCollection, where('businessId', '==', PAYSMART_BUSINESS_ID));
    const accessoriesSnapshot = await getDocs(q);
    
    console.log(`Récupération des accessoires filtrés par businessId: ${PAYSMART_BUSINESS_ID}, trouvés: ${accessoriesSnapshot.size}`);
    
    return accessoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingAccessory[];
  } catch (error) {
    console.error('Erreur lors de la récupération des accessoires marketing:', error);
    return [];
  }
};

/**
 * Récupère tous les accessoires marketing d'une catégorie spécifique
 */
export const getMarketingAccessoriesByCategory = async (category: string): Promise<MarketingAccessory[]> => {
  try {
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    // Filtrer à la fois par businessId et par catégorie
    const q = query(
      accessoriesCollection, 
      where('businessId', '==', PAYSMART_BUSINESS_ID),
      where('category', '==', category)
    );
    const accessoriesSnapshot = await getDocs(q);
    
    return accessoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingAccessory[];
  } catch (error) {
    console.error(`Erreur lors de la récupération des accessoires marketing de catégorie ${category}:`, error);
    return [];
  }
};

/**
 * Récupère un accessoire marketing spécifique par son ID
 */
export const getMarketingAccessoryById = async (accessoryId: string): Promise<MarketingAccessory | null> => {
  try {
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    const accessorySnap = await getDoc(accessoryRef);
    
    if (accessorySnap.exists()) {
      return {
        id: accessorySnap.id,
        ...accessorySnap.data()
      } as MarketingAccessory;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'accessoire marketing ${accessoryId}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouvel accessoire marketing
 */
export const addMarketingAccessory = async (accessoryData: Omit<MarketingAccessory, 'id'>): Promise<MarketingAccessory | null> => {
  try {
    // Assurer que le businessId est toujours défini lors de l'ajout d'un accessoire
    const dataToAdd = {
      ...accessoryData,
      businessId: PAYSMART_BUSINESS_ID
    };
    
    // Normaliser le champ active pour qu'il soit toujours un booléen
    if (dataToAdd.active !== undefined) {
      if (typeof dataToAdd.active === 'string') {
        const activeStr = dataToAdd.active.toLowerCase().trim();
        dataToAdd.active = ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(activeStr);
      } else if (typeof dataToAdd.active === 'number') {
        dataToAdd.active = dataToAdd.active === 1;
      }
    }
    
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    const docRef = await addDoc(accessoriesCollection, dataToAdd);
    
    return {
      id: docRef.id,
      ...dataToAdd
    } as MarketingAccessory;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'accessoire marketing:', error);
    return null;
  }
};

/**
 * Met à jour un accessoire marketing existant
 */
export const updateMarketingAccessory = async (accessoryId: string, accessoryData: Partial<MarketingAccessory>): Promise<boolean> => {
  try {
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    const accessorySnap = await getDoc(accessoryRef);
    
    if (!accessorySnap.exists()) {
      console.error(`L'accessoire marketing ${accessoryId} n'existe pas`);
      return false;
    }
    
    // Normaliser le champ active si présent dans les données à mettre à jour
    const dataToUpdate = {...accessoryData};
    
    if (dataToUpdate.active !== undefined) {
      if (typeof dataToUpdate.active === 'string') {
        const activeStr = dataToUpdate.active.toLowerCase().trim();
        dataToUpdate.active = ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(activeStr);
        console.log(`Normalisation du champ active: '${activeStr}' -> ${dataToUpdate.active}`);
      } else if (typeof dataToUpdate.active === 'number') {
        dataToUpdate.active = dataToUpdate.active === 1;
        console.log(`Normalisation du champ active numérique: ${accessoryData.active} -> ${dataToUpdate.active}`);
      }
    }
    
    // Assurer que businessId est correctement défini si présent
    if (dataToUpdate.businessId === undefined) {
      dataToUpdate.businessId = PAYSMART_BUSINESS_ID;
      console.log(`Ajout du businessId manquant: ${PAYSMART_BUSINESS_ID}`);
    }
    
    await updateDoc(accessoryRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'accessoire marketing ${accessoryId}:`, error);
    return false;
  }
};

/**
 * Supprime un accessoire marketing
 */
export const deleteMarketingAccessory = async (accessoryId: string): Promise<boolean> => {
  try {
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    const accessorySnap = await getDoc(accessoryRef);
    
    if (!accessorySnap.exists()) {
      console.error(`L'accessoire marketing ${accessoryId} n'existe pas`);
      return false;
    }
    
    await deleteDoc(accessoryRef);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'accessoire marketing ${accessoryId}:`, error);
    return false;
  }
};

/**
 * Active ou désactive un accessoire marketing
 * Garantit que le champ active est stocké comme booléen
 */
export const toggleMarketingAccessoryActive = async (accessoryId: string, active: boolean | string | number): Promise<boolean> => {
  // Normaliser la valeur active avant de l'envoyer à updateMarketingAccessory
  // Cette étape est redondante car updateMarketingAccessory normalise aussi,
  // mais cela garantit une cohérence si cette fonction est appelée directement
  let activeValue: boolean;
  
  if (typeof active === 'string') {
    const activeStr = active.toLowerCase().trim();
    activeValue = ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(activeStr);
    console.log(`toggleMarketingAccessoryActive: Conversion string '${active}' -> boolean ${activeValue}`);
  } else if (typeof active === 'number') {
    activeValue = active === 1;
    console.log(`toggleMarketingAccessoryActive: Conversion number ${active} -> boolean ${activeValue}`);
  } else {
    activeValue = active;
  }
  
  return updateMarketingAccessory(accessoryId, { active: activeValue });
};
