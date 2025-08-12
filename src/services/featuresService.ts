import { db } from '../firebase';
import { collection, addDoc, getDocs, query, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

// Collection Firestore
const FEATURES_COLLECTION = 'features';

// Interface pour les fonctionnalités
export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  isCore: boolean; // Fonctionnalité de base disponible dans tous les plans
  createdAt: number;
  updatedAt: number;
}

// Obtenir toutes les fonctionnalités
export const getAllFeatures = async (): Promise<Feature[]> => {
  try {
    // Utilisation d'une requête simple sans tri composé pour éviter les problèmes d'index
    const featuresQuery = query(
      collection(db, FEATURES_COLLECTION)
    );
    
    const snapshot = await getDocs(featuresQuery);
    const features = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Feature));
    
    // Tri côté client pour éviter les problèmes d'index Firestore
    return features.sort((a, b) => {
      // D'abord trier par catégorie
      const categoryComparison = a.category.localeCompare(b.category);
      if (categoryComparison !== 0) return categoryComparison;
      
      // Ensuite par nom
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fonctionnalités:', error);
    throw error;
  }
};

// Obtenir une fonctionnalité par ID
export const getFeatureById = async (featureId: string): Promise<Feature | null> => {
  try {
    const featureDoc = await getDoc(doc(db, FEATURES_COLLECTION, featureId));
    
    if (featureDoc.exists()) {
      return {
        id: featureDoc.id,
        ...featureDoc.data()
      } as Feature;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la fonctionnalité ${featureId}:`, error);
    throw error;
  }
};

// Ajouter une nouvelle fonctionnalité
export const addFeature = async (featureData: Omit<Feature, 'id'>): Promise<Feature> => {
  try {
    const docRef = await addDoc(collection(db, FEATURES_COLLECTION), {
      ...featureData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return {
      id: docRef.id,
      ...featureData
    } as Feature;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la fonctionnalité:', error);
    throw error;
  }
};

// Mettre à jour une fonctionnalité
export const updateFeature = async (featureId: string, featureData: Partial<Feature>): Promise<void> => {
  try {
    const featureRef = doc(db, FEATURES_COLLECTION, featureId);
    await updateDoc(featureRef, {
      ...featureData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la fonctionnalité ${featureId}:`, error);
    throw error;
  }
};

// Supprimer une fonctionnalité
export const deleteFeature = async (featureId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, FEATURES_COLLECTION, featureId));
  } catch (error) {
    console.error(`Erreur lors de la suppression de la fonctionnalité ${featureId}:`, error);
    throw error;
  }
};

// Initialiser les fonctionnalités par défaut
export const initializeDefaultFeatures = async (): Promise<void> => {
  try {
    const features = await getAllFeatures();
    
    // Si des fonctionnalités existent déjà, ne rien faire
    if (features.length > 0) {
      return;
    }
    
    // Fonctionnalités par défaut
    const defaultFeatures: Omit<Feature, 'id'>[] = [
      // Fonctionnalités de base (Core)
      {
        name: 'Gestion des ventes',
        description: 'Enregistrement et suivi des ventes',
        category: 'Ventes',
        isCore: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Gestion des produits',
        description: 'Ajout et modification des produits',
        category: 'Inventaire',
        isCore: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Tableau de bord basique',
        description: 'Statistiques essentielles de l\'activité',
        category: 'Rapports',
        isCore: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      
      // Fonctionnalités avancées
      {
        name: 'Gestion des promotions',
        description: 'Création et suivi des offres promotionnelles',
        category: 'Marketing',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Programme de fidélité',
        description: 'Gestion des cartes et points de fidélité',
        category: 'Marketing',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Analyses avancées',
        description: 'Rapports détaillés et analyses prédictives',
        category: 'Rapports',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Gestion des employés',
        description: 'Gestion des utilisateurs et des permissions',
        category: 'Administration',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Multi-magasins',
        description: 'Gestion de plusieurs points de vente',
        category: 'Administration',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'API personnalisable',
        description: 'Accès à l\'API pour intégrations personnalisées',
        category: 'Technique',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: 'Support prioritaire',
        description: 'Assistance technique prioritaire',
        category: 'Support',
        isCore: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    // Ajouter les fonctionnalités par défaut
    for (const feature of defaultFeatures) {
      await addFeature(feature);
    }
    
    console.log('Fonctionnalités par défaut initialisées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des fonctionnalités par défaut:', error);
    throw error;
  }
};
