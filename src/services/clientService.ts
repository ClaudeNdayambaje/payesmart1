import { db } from '../firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Client } from '../types/saas';
import { getClientSubscriptions } from './subscriptionService';
import { getClientPayments } from './paymentService';

// Collection Firestore
const CLIENTS_COLLECTION = 'businesses';

// Fonction de mappage de document business vers Client
const mapBusinessToClient = (docId: string, data: any): Client => {
  return {
    id: docId,
    businessName: data.name || '',
    contactName: data.owner || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    postalCode: data.postalCode || '',
    country: data.country || '',
    createdAt: data.createdAt || Date.now(),
    status: data.status || 'active',
    notes: data.notes || '',
    businessId: docId,
    trialStartDate: data.trialStartDate,
    trialEndDate: data.trialEndDate,
    isInTrial: data.isInTrial || false,
    deleted: data.deleted || false,
    deletedAt: data.deletedAt
  };
};

// Obtenir tous les clients
export const getClients = async (): Promise<Client[]> => {
  try {
    console.log('Récupération des clients depuis la collection businesses');
    const clientsQuery = query(
      collection(db, CLIENTS_COLLECTION)
      // Pas d'orderBy pour l'instant car le champ peut ne pas exister
    );
    
    const snapshot = await getDocs(clientsQuery);
    const clients = snapshot.docs.map(doc => mapBusinessToClient(doc.id, doc.data()));
    console.log(`${clients.length} clients récupérés depuis businesses`);
    return clients;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    throw error;
  }
};

// Obtenir un client par ID
export const getClientById = async (clientId: string): Promise<Client | null> => {
  try {
    const clientDoc = await getDoc(doc(db, CLIENTS_COLLECTION, clientId));
    
    if (clientDoc.exists()) {
      return mapBusinessToClient(clientDoc.id, clientDoc.data());
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du client ${clientId}:`, error);
    throw error;
  }
};

// Ajouter un nouveau client
export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
  try {
    // Transformer les données Client en format Business
    const businessData = {
      name: clientData.businessName,
      owner: clientData.contactName,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      postalCode: clientData.postalCode,
      country: clientData.country,
      createdAt: Date.now(),
      status: clientData.status || 'active',
      notes: clientData.notes,
      isInTrial: clientData.isInTrial || false,
      trialStartDate: clientData.trialStartDate,
      trialEndDate: clientData.trialEndDate,
      currency: 'EUR',
      language: 'fr',
      timezone: 'Europe/Paris'
    };
    
    const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), businessData);
    
    return mapBusinessToClient(docRef.id, businessData);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du client:', error);
    throw error;
  }
};

// Mettre à jour un client
export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<void> => {
  try {
    // Transformer les données Client en format Business
    const businessData: Record<string, any> = {};
    
    if (clientData.businessName) businessData.name = clientData.businessName;
    if (clientData.contactName) businessData.owner = clientData.contactName;
    if (clientData.email) businessData.email = clientData.email;
    if (clientData.phone) businessData.phone = clientData.phone;
    if (clientData.address) businessData.address = clientData.address;
    if (clientData.city) businessData.city = clientData.city;
    if (clientData.postalCode) businessData.postalCode = clientData.postalCode;
    if (clientData.country) businessData.country = clientData.country;
    if (clientData.status) businessData.status = clientData.status;
    if (clientData.notes) businessData.notes = clientData.notes;
    if (clientData.isInTrial !== undefined) businessData.isInTrial = clientData.isInTrial;
    if (clientData.trialStartDate) businessData.trialStartDate = clientData.trialStartDate;
    if (clientData.trialEndDate) businessData.trialEndDate = clientData.trialEndDate;
    if (clientData.deleted !== undefined) businessData.deleted = clientData.deleted;
    if (clientData.deletedAt) businessData.deletedAt = clientData.deletedAt;
    
    await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), businessData);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du client ${clientId}:`, error);
    throw error;
  }
};

// Suppression simple d'un client (conserve les données liées)
export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    // Plutôt que de supprimer complètement, marquer comme supprimé
    await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
      deleted: true,
      deletedAt: Date.now(),
      status: 'DELETED'
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du client ${clientId}:`, error);
    throw error;
  }
};

// Vérifier si un document existe dans Firestore
const doesDocumentExist = async (collection: string, documentId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, collection, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'existence du document ${documentId}:`, error);
    return false;
  }
};

// Vérifier si un client a des références qui empêchent sa suppression directe
const checkClientReferences = async (clientId: string): Promise<string[]> => {
  const references: string[] = [];
  
  try {
    // Vérifier les abonnements sans utiliser d'index
    const subscriptionsSnapshot = await getDocs(
      query(collection(db, 'subscriptions'), where('clientId', '==', clientId), limit(1))
    );
    if (!subscriptionsSnapshot.empty) {
      references.push('subscriptions');
    }
    
    // Vérifier les paiements sans utiliser d'index
    const paymentsSnapshot = await getDocs(
      query(collection(db, 'payments'), where('clientId', '==', clientId), limit(1))
    );
    if (!paymentsSnapshot.empty) {
      references.push('payments');
    }
    
    // Ajouter d'autres vérifications si nécessaire...
    
  } catch (error) {
    console.error(`Erreur lors de la vérification des références du client ${clientId}:`, error);
  }
  
  return references;
};

// Suppression complète d'un client et de toutes ses données associées
export const deleteClientComplete = async (clientId: string, businessId: string): Promise<boolean> => {
  console.log(`🗑️ Démarrage de la suppression complète du client ${clientId}...`);
  
  // Créer une liste des entités qui ont été supprimées avec succès
  const successfullyDeletedEntities: string[] = [];
  let clientUpdated = false;
  
  try {
    // Vérifier s'il y a des références qui empêcheraient la suppression directe
    const references = await checkClientReferences(clientId);
    if (references.length > 0) {
      console.log(`⚠️ Le client a des références dans: ${references.join(', ')}. Suppression des références d'abord...`);
    }
    
    // 3. Tenter de supprimer les abonnements liés en premier
    try {
      console.log(`🔍 Recherche des abonnements du client ${clientId}...`);
      const subscriptions = await getClientSubscriptions(clientId);
      console.log(`✅ ${subscriptions.length} abonnements trouvés.`);
      
      // Supprimer chaque abonnement individuellement pour éviter que l'un ne fasse échouer les autres
      for (const subscription of subscriptions) {
        try {
          await deleteDoc(doc(db, 'subscriptions', subscription.id));
          successfullyDeletedEntities.push(`Abonnement ${subscription.id}`);
        } catch (subError) {
          console.error(`❌ Erreur lors de la suppression de l'abonnement ${subscription.id}:`, subError);
          // Essayer de mettre à jour l'abonnement pour supprimer la référence au client
          try {
            await updateDoc(doc(db, 'subscriptions', subscription.id), {
              clientId: "DELETED_CLIENT",
              status: "DELETED"
            });
            console.log(`✅ Abonnement ${subscription.id} marqué comme supprimé.`);
            successfullyDeletedEntities.push(`Abonnement détagé ${subscription.id}`);
          } catch (updateError) {
            console.error(`❌ Impossible de mettre à jour l'abonnement ${subscription.id}:`, updateError);
          }
        }
      }
      console.log(`✅ Abonnements traités.`);
    } catch (subsError) {
      console.error(`❌ Erreur lors de la récupération des abonnements:`, subsError);
    }
    
    // 4. Tenter de supprimer les paiements liés
    try {
      console.log(`🔍 Recherche des paiements du client ${clientId}...`);
      const payments = await getClientPayments(clientId);
      console.log(`✅ ${payments.length} paiements trouvés.`);
      
      // Supprimer chaque paiement individuellement
      for (const payment of payments) {
        try {
          await deleteDoc(doc(db, 'payments', payment.id));
          successfullyDeletedEntities.push(`Paiement ${payment.id}`);
        } catch (payError) {
          console.error(`❌ Erreur lors de la suppression du paiement ${payment.id}:`, payError);
          // Essayer de mettre à jour le paiement pour supprimer la référence au client
          try {
            await updateDoc(doc(db, 'payments', payment.id), {
              clientId: "DELETED_CLIENT",
              status: "DELETED"
            });
            console.log(`✅ Paiement ${payment.id} marqué comme supprimé.`);
            successfullyDeletedEntities.push(`Paiement détagé ${payment.id}`);
          } catch (updateError) {
            console.error(`❌ Impossible de mettre à jour le paiement ${payment.id}:`, updateError);
          }
        }
      }
      console.log(`✅ Paiements traités.`);
    } catch (paymentsError) {
      console.error(`❌ Erreur lors de la récupération des paiements:`, paymentsError);
    }
    
    // 1. Essayer de supprimer directement le client maintenant que les références sont traitées
    try {
      console.log(`🔥 Suppression directe du client ${clientId}...`);
      await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId));
      successfullyDeletedEntities.push(`Client ${clientId}`);
      console.log(`✅ Client ${clientId} supprimé avec succès.`);
    } catch (clientError: any) {
      console.error(`❌ Erreur lors de la suppression du client ${clientId}:`, clientError);
      
      // Si l'erreur est "failed-precondition", essayer de détacher le client en le mettant à jour
      if (clientError?.code === "failed-precondition") {
        console.log(`⚠️ Erreur de précondition, tentative de mise à jour du client pour le marquer comme supprimé...`);
        try {
          // Mettre à jour le client pour le marquer comme supprimé
          await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
            email: `DELETED_${clientId}@deleted.com`,
            name: "COMPTE SUPPRIMÉ",
            surname: "",
            businessId: "",
            status: "DELETED",
            deleted: true,
            deletedAt: serverTimestamp()
          });
          clientUpdated = true;
          console.log(`✅ Client ${clientId} marqué comme supprimé.`);
          successfullyDeletedEntities.push(`Client désactivé ${clientId}`);
        } catch (updateError) {
          console.error(`❌ Erreur lors de la mise à jour du client ${clientId}:`, updateError);
        }
      }
    }
    
    // 2. Essayer de supprimer l'entreprise liée si elle existe
    if (businessId) {
      try {
        // Vérifier d'abord s'il y a d'autres clients utilisant cette entreprise
        const clientsWithBusiness = await getDocs(
          query(collection(db, CLIENTS_COLLECTION), 
                where('businessId', '==', businessId),
                where('deleted', '==', false),
                limit(2))
        );
        
        // Ne supprimer l'entreprise que si ce client était le seul à l'utiliser
        const shouldDeleteBusiness = clientsWithBusiness.size <= 1 || 
                                    (clientsWithBusiness.size === 1 && 
                                     clientsWithBusiness.docs[0].id === clientId);
        
        if (shouldDeleteBusiness) {
          console.log(`🔥 Suppression de l'entreprise ${businessId}...`);
          await deleteDoc(doc(db, 'businesses', businessId));
          successfullyDeletedEntities.push(`Entreprise ${businessId}`);
          console.log(`✅ Entreprise ${businessId} supprimée avec succès.`);
          
          // 5. Tenter de supprimer les données liées à l'entreprise
          // Supprimer les employés
          try {
            const employeesQuery = query(collection(db, 'employees'), where('businessId', '==', businessId));
            const employeesSnapshot = await getDocs(employeesQuery);
            console.log(`✅ ${employeesSnapshot.size} employés trouvés.`);
            
            for (const employeeDoc of employeesSnapshot.docs) {
              try {
                await deleteDoc(doc(db, 'employees', employeeDoc.id));
                successfullyDeletedEntities.push(`Employé ${employeeDoc.id}`);
              } catch (empError) {
                console.error(`❌ Erreur lors de la suppression de l'employé ${employeeDoc.id}:`, empError);
              }
            }
          } catch (empQueryError) {
            console.error(`❌ Erreur lors de la recherche des employés:`, empQueryError);
          }
          
          // Supprimer les produits, catégories et ventes uniquement si l'entreprise a été supprimée
          try {
            await Promise.allSettled([
              // Supprimer les produits
              getDocs(query(collection(db, 'products'), where('businessId', '==', businessId)))
                .then(snapshot => Promise.allSettled(
                  snapshot.docs.map(doc => deleteDoc(doc.ref))
                )),
              // Supprimer les catégories
              getDocs(query(collection(db, 'categories'), where('businessId', '==', businessId)))
                .then(snapshot => Promise.allSettled(
                  snapshot.docs.map(doc => deleteDoc(doc.ref))
                )),
              // Supprimer les ventes
              getDocs(query(collection(db, 'sales'), where('businessId', '==', businessId)))
                .then(snapshot => Promise.allSettled(
                  snapshot.docs.map(doc => deleteDoc(doc.ref))
                ))
            ]);
            console.log(`✅ Traitement des produits, catégories et ventes terminé.`);
          } catch (otherDataError) {
            console.error(`❌ Erreur lors de la suppression des données associées à l'entreprise:`, otherDataError);
          }
        } else {
          console.log(`⚠️ L'entreprise ${businessId} est utilisée par d'autres clients actifs, elle ne sera pas supprimée.`);
        }
      } catch (businessError) {
        console.error(`❌ Erreur lors de la suppression de l'entreprise ${businessId}:`, businessError);
      }
    }
    
    // Vérifier si le client existe toujours et s'il n'a pas été mis à jour
    const clientStillExists = await doesDocumentExist(CLIENTS_COLLECTION, clientId);
    if (clientStillExists && !clientUpdated) {
      console.warn(`⚠️ Le client existe toujours et n'a pas été marqué comme supprimé. Dernière tentative...`);
      try {
        // Dernière tentative: marquer simplement comme supprimé
        await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
          deleted: true,
          deletedAt: serverTimestamp(),
          status: "DELETED"
        });
        successfullyDeletedEntities.push(`Client désactivé ${clientId}`);
        console.log(`✅ Client marqué comme supprimé avec succès.`);
      } catch (finalError) {
        console.error(`❌ Erreur lors de la dernière tentative de marquer le client comme supprimé:`, finalError);
      }
    }
    
    // Terminer avec un résumé des éléments supprimés
    console.log(`✅ Opération terminée. ${successfullyDeletedEntities.length} éléments traités.`);
    
    // Considérer la suppression réussie si le client a été supprimé ou marqué comme supprimé
    const success = successfullyDeletedEntities.some(entity => 
      entity.includes(`Client ${clientId}`) || entity.includes(`Client désactivé ${clientId}`));
    
    return success;
  } catch (error) {
    console.error(`❌ Erreur générale lors de la suppression complète du client ${clientId}:`, error);
    
    // Même en cas d'erreur générale, considérer la suppression réussie si le client a été supprimé ou marqué comme tel
    return successfullyDeletedEntities.some(entity => 
      entity.includes(`Client ${clientId}`) || entity.includes(`Client désactivé ${clientId}`));
  }
};

// Rechercher des clients
export const searchClients = async (searchTerm: string): Promise<Client[]> => {
  try {
    // Base de recherche : tous les clients (sauf supprimés)
    const allClients = await getClients();
    const activeClients = allClients.filter(client => !client.deleted);
    
    // Filtrer les clients qui correspondent au terme de recherche
    if (!searchTerm.trim()) return activeClients;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return activeClients.filter(client => {
      return (
        client.businessName.toLowerCase().includes(searchTermLower) ||
        client.contactName.toLowerCase().includes(searchTermLower) ||
        client.email.toLowerCase().includes(searchTermLower) ||
        client.phone.includes(searchTermLower)
      );
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de clients:', error);
    throw error;
  }
};
