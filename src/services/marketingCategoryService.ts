import { db } from '../firebase';
import { collection, getDocs, query, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Category } from '../types';

// Collections Firestore pour les accessoires marketing et les catégories
const ACCESSORIES_COLLECTION = 'accessoires';
const MARKETING_CATEGORIES_COLLECTION = 'marketing_categories'; // Nouvelle collection pour les catégories marketing
const PAYSMART_BUSINESS_ID = 'Hrk3nn1HVlcHOJ7InqK1';

/**
 * Récupère les catégories uniques depuis les accessoires marketing existants
 */
export const getMarketingCategories = async (): Promise<Category[]> => {
  try {
    console.log(`🔎 Récupération des catégories depuis les accessoires marketing`);
    
    // Récupérer tous les accessoires marketing
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    const q = query(accessoriesCollection);
    const accessoriesSnapshot = await getDocs(q);
    
    console.log(`📊 Nombre d'accessoires trouvés: ${accessoriesSnapshot.size}`);
    
    // Extraire les catégories uniques
    const categoriesMap: Map<string, Category> = new Map();
    
    accessoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Vérifier si la catégorie existe et n'est pas vide
      if (data.category && typeof data.category === 'string' && data.category.trim() !== '') {
        const categoryId = data.category.toLowerCase().trim();
        const categoryName = data.category.trim();
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            businessId: PAYSMART_BUSINESS_ID
            // La propriété createdAt a été supprimée car elle n'existe pas dans l'interface Category
          });
        }
      }
    });
    
    // Convertir la Map en tableau
    const categories: Category[] = Array.from(categoriesMap.values());
    
    console.log(`📋 ${categories.length} catégories uniques trouvées`);
    
    // Trier les catégories par nom
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories marketing:', error);
    return [];
  }
};

/**
 * Ajoute une nouvelle catégorie marketing
 */
export const addCategory = async (categoryName: string): Promise<Category | null> => {
  try {
    console.log(`📝 Ajout d'une nouvelle catégorie marketing: ${categoryName}`);
    
    // Vérifier que le nom n'est pas vide
    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      console.error('❌ Le nom de la catégorie ne peut pas être vide');
      return null;
    }
    
    // Créer la nouvelle catégorie
    const newCategory = {
      name: categoryName.trim(),
      businessId: PAYSMART_BUSINESS_ID,
      createdAt: serverTimestamp()
    };
    
    // Ajouter à la collection des catégories marketing
    const categoriesCollection = collection(db, MARKETING_CATEGORIES_COLLECTION);
    const docRef = await addDoc(categoriesCollection, newCategory);
    
    // Retourner la catégorie avec son ID
    return {
      id: docRef.id,
      name: newCategory.name,
      businessId: newCategory.businessId
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la catégorie marketing:', error);
    return null;
  }
};

/**
 * Supprime une catégorie marketing par son ID
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  try {
    if (!categoryId) {
      console.error('❌ L\'ID de catégorie ne peut pas être vide');
      return false;
    }
    
    console.log(`🚫 Suppression de la catégorie marketing: ${categoryId}`);
    
    // Récupérer la référence du document et le supprimer
    const categoryRef = doc(db, MARKETING_CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(categoryRef);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de la catégorie marketing ${categoryId}:`, error);
    return false;
  }
};
