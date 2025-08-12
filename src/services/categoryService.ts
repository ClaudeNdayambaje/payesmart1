import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { Category } from '../types';
import { getCurrentUser } from './authService';

// Collection spécifique pour les catégories d'accessoires
// Cette collection est séparée des autres catégories de l'application
const ACCESSORY_CATEGORIES_COLLECTION = 'accessory_categories';

/**
 * Récupère le businessId de l'utilisateur connecté
 */
const getCurrentBusinessId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user ? user.uid : null;
};

/**
 * Vérifie si une catégorie est valide (contient un id et un nom valide)
 */
const isCategoryValid = (category: any): boolean => {
  if (!category || !category.id) return false;
  
  // Format 1: name est directement une chaîne
  if (typeof category.name === 'string' && category.name.trim() !== '') {
    return true;
  }
  
  // Format 2: name est un objet contenant une propriété name qui est une chaîne
  if (
    category.name && 
    typeof category.name === 'object' && 
    category.name !== null &&
    'name' in category.name && 
    typeof category.name.name === 'string' && 
    category.name.name.trim() !== ''
  ) {
    return true;
  }
  
  return false;
};

/**
 * Extrait le nom normalisé d'une catégorie, quel que soit son format
 */
const getNormalizedCategoryName = (category: any): string => {
  // Si le nom est déjà une chaîne
  if (typeof category.name === 'string') {
    return category.name;
  }
  
  // Si le nom est un objet {name: {name: 'valeur'}}
  if (
    category.name && 
    typeof category.name === 'object' && 
    category.name !== null &&
    'name' in category.name && 
    typeof category.name.name === 'string'
  ) {
    return category.name.name;
  }
  
  return '';
};

/**
 * Récupère toutes les catégories d'accessoires
 * Filtre automatiquement les catégories invalides
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('❌ Aucun utilisateur connecté');
      return [];
    }
    
    console.log(`🔎 Récupération des catégories d'accessoires pour l'entreprise ${businessId}`);
    
    // Récupérer toutes les catégories de la collection spécifique aux accessoires
    const categoriesCollection = collection(db, ACCESSORY_CATEGORIES_COLLECTION);
    
    // Filtrer par businessId mais aussi par type="accessory" si présent
    let q = query(categoriesCollection, where("businessId", "==", businessId));
    
    const categoriesSnapshot = await getDocs(q);
    
    console.log(`📊 Nombre de catégories trouvées: ${categoriesSnapshot.size}`);
    
    const categories: Category[] = [];
    const invalidCategories: any[] = [];
    
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const category = { id: doc.id, ...data } as any;
      
      // Utiliser la fonction de normalisation pour extraire le nom
      if (category.name && typeof category.name === 'object') {
        category.originalNameFormat = {...category.name}; // Conserver l'original au cas où
        category.name = getNormalizedCategoryName(category); // Normaliser pour l'interface
      }
      
      // Vérifier si la catégorie est valide avant de l'ajouter
      if (isCategoryValid(category)) {
        categories.push(category as Category);
      } else {
        invalidCategories.push(category);
        console.warn(`⚠️ Catégorie invalide ignorée: ID=${doc.id}, données=${JSON.stringify(data)}`);
      }
    });
    
    if (invalidCategories.length > 0) {
      console.log(`🔍 ${invalidCategories.length} catégories invalides à supprimer`);
      // Possibilité d'appeler cleanInvalidCategories ici automatiquement
    }
    
    // Trier les catégories par nom pour un affichage cohérent
    return categories.sort((a, b) => {
      // Les catégories sont déjà validées, donc a.name et b.name sont des chaînes
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error);
    return [];
  }
};

/**
 * Récupère une catégorie par son ID
 */
export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const categoryRef = doc(db, ACCESSORY_CATEGORIES_COLLECTION, categoryId);
    const categorySnap = await getDoc(categoryRef);
    
    if (categorySnap.exists()) {
      const categoryData = categorySnap.data();
      
      // Vérifier que la catégorie appartient à l'entreprise de l'utilisateur connecté
      if (categoryData.businessId !== businessId) {
        console.error(`La catégorie ${categoryId} n'appartient pas à votre entreprise`);
        return null;
      }
      
      return {
        id: categorySnap.id,
        ...categoryData
      } as Category;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la catégorie ${categoryId}:`, error);
    return null;
  }
};

/**
 * Ajoute une nouvelle catégorie
 */
export const addCategory = async (name: string | any): Promise<Category | null> => {
  try {
    // Normaliser le nom de catégorie (s'il s'agit d'un objet)
    let categoryName: string;
    
    if (typeof name === 'string') {
      categoryName = name.trim();
    } else if (name && typeof name === 'object' && 'name' in name && typeof name.name === 'string') {
      categoryName = name.name.trim();
    } else {
      console.error('Format de nom de catégorie invalide:', name);
      return null;
    }
    
    // Vérifier que la catégorie n'existe pas déjà
    const existingCategories = await getCategories();
    const categoryExists = existingCategories.some(cat => {
      // Vérifier que cat et cat.name existent et que cat.name est une chaîne
      if (!cat || typeof cat.name !== 'string') {
        console.warn('Catégorie invalide détectée dans existingCategories:', cat);
        return false;
      }
      
      // Vérifier que cat.name est une chaîne avant d'appeler toLowerCase
      const catName = cat.name.toLowerCase();
      return catName === categoryName.toLowerCase();
    });
    
    if (categoryExists) {
      console.error('Cette catégorie existe déjà');
      return null;
    }
    
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    // Créer la nouvelle catégorie
    const newCategory = {
      name: categoryName, // Utiliser le nom normalisé
      active: true,
      createdAt: serverTimestamp(),
      businessId,
      type: 'accessory' // Marquer explicitement comme catégorie d'accessoire
    };
    
    console.log(`📝 Création d'une nouvelle catégorie d'accessoire: ${categoryName} pour l'entreprise: ${businessId}`);
    const docRef = await addDoc(collection(db, ACCESSORY_CATEGORIES_COLLECTION), newCategory);
    return { id: docRef.id, ...newCategory } as Category;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la catégorie:', error);
    return null;
  }
};

/**
 * Met à jour une catégorie existante
 */
export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Vérifier que la catégorie appartient à l'entreprise de l'utilisateur connecté
    const categorySnap = await getDoc(doc(db, ACCESSORY_CATEGORIES_COLLECTION, categoryId));
    if (!categorySnap.exists() || categorySnap.data().businessId !== businessId) {
      console.error(`La catégorie ${categoryId} n'appartient pas à votre entreprise`);
      return false;
    }
    
    // Si on met à jour le nom, vérifier qu'il n'existe pas déjà
    if (categoryData.name) {
      const existingCategories = await getCategories();
      const categoryExists = existingCategories.some(
        existingCat => 
          existingCat.id !== categoryId && 
          existingCat.name.toLowerCase() === categoryData.name!.toLowerCase()
      );
      
      if (categoryExists) {
        console.error(`Une catégorie avec le nom "${categoryData.name}" existe déjà`);
        return false;
      }
    }
    
    const categoryRef = doc(db, ACCESSORY_CATEGORIES_COLLECTION, categoryId);
    
    // Supprimer businessId des données à mettre à jour pour éviter de le modifier
    const updateData = { ...categoryData };
    delete updateData.businessId;
    
    await updateDoc(categoryRef, updateData);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la catégorie ${categoryId}:`, error);
    return false;
  }
};

/**
 * Supprime une catégorie d'accessoire
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Tentative de suppression de la catégorie d'accessoire ${categoryId}`);
    
    // Vérifier d'abord qu'un businessId est disponible
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('❌ Aucun utilisateur connecté pour effectuer la suppression');
      return false;
    }
    
    // Référence au document à supprimer
    const categoryRef = doc(db, ACCESSORY_CATEGORIES_COLLECTION, categoryId);
    
    // Vérifier que le document existe
    const categorySnap = await getDoc(categoryRef);
    if (!categorySnap.exists()) {
      console.error(`❌ La catégorie ${categoryId} n'existe pas dans la collection des accessoires`);
      return false;
    }
    
    // Vérifier si la catégorie appartient à l'entreprise actuelle
    const categoryData = categorySnap.data();
    if (categoryData.businessId && categoryData.businessId !== businessId) {
      console.error(`❌ Vous n'avez pas l'autorisation de supprimer cette catégorie: ${categoryId} (appartient à l'entreprise ${categoryData.businessId})`);
      return false;
    }
    
    // Logs pour débogage
    console.log(`📝 Détails de la catégorie avant suppression:`, JSON.stringify(categoryData));
    console.log(`🔥 Suppression de la catégorie ${categoryId} dans Firestore...`);
    
    // Exécution de la suppression
    await deleteDoc(categoryRef);
    
    console.log(`✅ Catégorie d'accessoire ${categoryId} supprimée avec succès`);
    return true;
  } catch (error) {
    // Affichage détaillé de l'erreur
    console.error(`❌ Erreur lors de la suppression de la catégorie ${categoryId}:`, error);
    if (error instanceof Error) {
      console.error(`Détails: ${error.name} - ${error.message}`, error.stack);
    }
    return false;
  }
};

/**
 * Nettoie les catégories invalides dans Firestore
 */
export const cleanInvalidCategories = async (): Promise<{ deleted: number, errors: number, fixed: number }> => {
  const result = { deleted: 0, errors: 0, fixed: 0 };
  
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('❌ Aucun utilisateur connecté');
      return result;
    }
    
    console.log(`🧹 Début du nettoyage des catégories invalides pour l'entreprise ${businessId}...`);
    
    // Récupérer toutes les catégories sans filtrage
    const categoriesCollection = collection(db, ACCESSORY_CATEGORIES_COLLECTION);
    const q = query(categoriesCollection, where("businessId", "==", businessId));
    const categoriesSnapshot = await getDocs(q);
    
    console.log(`📊 Analyse de ${categoriesSnapshot.size} catégories`);
    
    const invalidCategories: { id: string, data: any }[] = [];
    const categoriesToFix: { id: string, data: any }[] = [];
    
    // Identifier les catégories invalides et celles qui peuvent être réparées
    categoriesSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const category = { id: docSnap.id, ...data } as any;
      
      // Si la catégorie a un objet name avec une propriété name valide,
      // on peut la réparer en normalisant la structure
      if (
        category.name && 
        typeof category.name === 'object' && 
        category.name !== null &&
        'name' in category.name && 
        typeof category.name.name === 'string' && 
        category.name.name.trim() !== ''
      ) {
        const normalizedName = getNormalizedCategoryName(category);
        categoriesToFix.push({ id: docSnap.id, data: {...data, name: normalizedName} });
        console.log(`🔧 Catégorie à réparer: ID=${docSnap.id}, ancien nom=${JSON.stringify(data.name)}, nouveau nom="${normalizedName}"`);
      }
      // Sinon, si elle est vraiment invalide, on la supprime
      else if (!isCategoryValid(category)) {
        invalidCategories.push({ id: docSnap.id, data });
        console.log(`⚠️ Catégorie invalide détectée: ID=${docSnap.id}, données=${JSON.stringify(data)}`);
      }
    });
    
    console.log(`🔍 ${invalidCategories.length} catégories invalides à supprimer`);
    console.log(`🔧 ${categoriesToFix.length} catégories à réparer`);
    
    // Supprimer les catégories invalides
    for (const invalidCategory of invalidCategories) {
      try {
        await deleteDoc(doc(db, ACCESSORY_CATEGORIES_COLLECTION, invalidCategory.id));
        console.log(`✅ Catégorie supprimée: ID=${invalidCategory.id}`);
        result.deleted++;
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de la catégorie ID=${invalidCategory.id}:`, error);
        result.errors++;
      }
    }
    
    // Réparer les catégories qui ont un format de nom incorrect mais valide
    for (const categoryToFix of categoriesToFix) {
      try {
        await updateDoc(doc(db, ACCESSORY_CATEGORIES_COLLECTION, categoryToFix.id), {
          name: categoryToFix.data.name // le nom normalisé (string au lieu d'objet)
        });
        console.log(`✅ Catégorie réparée: ID=${categoryToFix.id}`);
        result.fixed++;
      } catch (error) {
        console.error(`❌ Erreur lors de la réparation de la catégorie ID=${categoryToFix.id}:`, error);
        result.errors++;
      }
    }
    
    console.log(`🧹 Nettoyage terminé: ${result.deleted} catégories supprimées, ${result.fixed} catégories réparées, ${result.errors} erreurs`);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des catégories invalides:', error);
    return { deleted: 0, errors: 1, fixed: 0 };
  }
};

/**
 * Supprime les doublons de catégories
 * Cette fonction identifie les catégories avec des noms identiques (insensible à la casse)
 * et conserve uniquement la première occurrence
 */
export const removeDuplicateCategories = async (): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Récupérer toutes les catégories
    const allCategories = await getCategories();
    // Note: getCategories filtre déjà les catégories invalides
    
    // Créer un Map pour stocker les catégories uniques (clé = nom en minuscules)
    const uniqueCategoriesMap = new Map<string, Category>();
    const duplicatesToRemove: Category[] = [];
    
    // Identifier les doublons
    allCategories.forEach(category => {
      const lowerCaseName = category.name.toLowerCase();
      
      if (!uniqueCategoriesMap.has(lowerCaseName)) {
        // Première occurrence, on la garde
        uniqueCategoriesMap.set(lowerCaseName, category);
      } else {
        // C'est un doublon, on l'ajoute à la liste à supprimer
        duplicatesToRemove.push(category);
      }
    });
    
    // Si aucun doublon, rien à faire
    if (duplicatesToRemove.length === 0) {
      console.log('Aucun doublon de catégorie trouvé');
      return true;
    }
    
    console.log(`${duplicatesToRemove.length} doublons de catégories trouvés, suppression en cours...`);
    
    // Pour chaque doublon, mettre à jour les produits associés
    for (const duplicate of duplicatesToRemove) {
      // Trouver la catégorie originale correspondante
      // Vérifier que duplicate.name existe et est une chaîne
      if (typeof duplicate.name !== 'string') {
        console.warn('Nom de catégorie invalide lors de la suppression des doublons:', duplicate);
        continue; // Passer au doublon suivant
      }
      
      const originalCategory = uniqueCategoriesMap.get(duplicate.name.toLowerCase());
      
      if (originalCategory) {
        // Mettre à jour les produits qui utilisent cette catégorie
        const productsCollection = collection(db, 'products');
        const q = query(
          productsCollection, 
          where("businessId", "==", businessId),
          where("category", "==", duplicate.name)
        );
        const productsSnapshot = await getDocs(q);
        
        // Mettre à jour chaque produit pour utiliser la catégorie originale
        const updatePromises = productsSnapshot.docs.map(productDoc => {
          const productRef = doc(db, 'products', productDoc.id);
          return updateDoc(productRef, { category: originalCategory.name });
        });
        
        await Promise.all(updatePromises);
        
        // Supprimer la catégorie en doublon
        await deleteDoc(doc(db, ACCESSORY_CATEGORIES_COLLECTION, duplicate.id));
      }
    }
    
    console.log('Suppression des doublons de catégories terminée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression des doublons de catégories:', error);
    return false;
  }
};
