import React, { useState, useEffect } from 'react';
import { deleteClient } from '../../services/clientService';
import { getAllBusinesses } from '../../services/getAllBusinesses';
import { Business } from '../../types';
import { Client } from '../../types/saas';
import VivaConfigButton from '../viva/VivaConfigButton';

// Utiliser la définition de type Business avec tous les champs nécessaires
type BusinessWithAllFields = Business & {
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string | { street?: string; city?: string; postalCode?: string; country?: string; };
  city?: string;
  postalCode?: string;
  country?: string;
  owner?: string;
  status?: string;
  deleted?: boolean;
  isInTrial?: boolean;
  trialStartDate?: number;
  trialEndDate?: number;
  notes?: string;
};

interface ClientsListProps {
  onEditClient: (client: Client) => void;
  onAddNewClient: () => void;
}

// Fonction pour convertir un objet Business en Client
const businessToClient = (business: BusinessWithAllFields): Client => {
  // Vérifier si business est défini
  if (!business) {
    console.error('Erreur: objet business non défini');
    // Retourner un client par défaut
    return {
      id: 'error',
      businessName: 'Erreur',
      contactName: 'Erreur',
      email: 'erreur@example.com',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      createdAt: Date.now(),
      status: 'inactive',
      notes: 'Erreur de conversion',
      businessId: 'error',
      isInTrial: false
    };
  }

  console.log('Conversion d\'un document business en client:', business);

  // Obtenir le nom de l'entreprise, en vérifiant différents champs possibles
  const businessName = business.name || business.businessName || 'Sans nom';
  
  // Obtenir le nom du contact, en vérifiant différentes structures possibles
  let contactName = 'Inconnu';
  if (business.owner) {
    contactName = typeof business.owner === 'string' ? business.owner : 'Inconnu';
  } else if (business.ownerFirstName || business.ownerLastName) {
    contactName = `${business.ownerFirstName || ''} ${business.ownerLastName || ''}`.trim();
  }

  // Traiter l'adresse en fonction de son type
  let addressStr = '';
  let city = '';
  let postalCode = '';
  let country = '';

  // Vérifier si l'adresse est présente
  if (business.address) {
    // Si l'adresse est un objet
    if (typeof business.address === 'object' && business.address !== null) {
      const addressObj = business.address as { street?: string; city?: string; postalCode?: string; country?: string; };
      addressStr = addressObj.street || '';
      city = addressObj.city || '';
      postalCode = addressObj.postalCode || '';
      country = addressObj.country || '';
    } else {
      // Si l'adresse est une chaîne
      addressStr = business.address as string;
    }
  }

  // Vérifier les champs de niveau supérieur
  city = business.city || city;
  postalCode = business.postalCode || postalCode;
  country = business.country || country;

  // Traiter la date de création
  let createdAtTimestamp = Date.now();
  if (business.createdAt) {
    if (business.createdAt instanceof Date) {
      createdAtTimestamp = business.createdAt.getTime();
    } else if (typeof business.createdAt === 'number') {
      createdAtTimestamp = business.createdAt;
    } else if (typeof business.createdAt === 'string') {
      createdAtTimestamp = new Date(business.createdAt).getTime();
    }
  }

  // Déterminer le statut du client
  let clientStatus: 'active' | 'inactive' | 'pending' | 'Active' | 'DELETED' = 'active';
  
  if (business.status) {
    if (business.status === 'active' || business.status === 'Active') {
      clientStatus = 'active';
    } else if (business.status === 'inactive') {
      clientStatus = 'inactive';
    } else if (business.status === 'pending') {
      clientStatus = 'pending';
    } else if (business.status === 'DELETED') {
      clientStatus = 'DELETED';
    }
  } else if (business.active === false) {
    clientStatus = 'inactive';
  } else if (business.deleted) {
    clientStatus = 'DELETED';
  }

  // Vérifier si le client est en essai
  const isInTrial = business.isInTrial === true;

  return {
    id: business.id || 'unknown',
    businessName: businessName,
    contactName: contactName,
    email: business.email || '',
    phone: business.phone || '',
    address: addressStr,
    city: city,
    postalCode: postalCode,
    country: country,
    createdAt: createdAtTimestamp,
    status: clientStatus,
    notes: business.notes || '',
    businessId: business.id || 'unknown',
    trialStartDate: business.trialStartDate,
    trialEndDate: business.trialEndDate,
    isInTrial: isInTrial
  };
};

const ClientsList: React.FC<ClientsListProps> = ({ onEditClient, onAddNewClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        console.log('🔍 Récupération des entreprises depuis Firestore...');
        
        // Récupérer les entreprises de la collection 'businesses' de Firestore
        const businessesData = await getAllBusinesses() as BusinessWithAllFields[];
        console.log('✅ Entreprises récupérées:', businessesData.length);
        
        if (businessesData.length === 0) {
          console.warn('⚠️ Aucune entreprise trouvée dans Firestore');
          setClients([]);
          return;
        }
        
        // Vérifier la structure des données reçues
        console.log('📋 Structure de la première entreprise:', JSON.stringify(businessesData[0], null, 2));
        
        // Convertir les objets Business en objets Client pour l'affichage
        const clientsData = businessesData.map(business => {
          const client = businessToClient(business);
          console.log(`🔄 Conversion de l'entreprise ${business.id} en client:`, client.businessName);
          return client;
        });
        
        console.log('✅ Entreprises converties en clients:', clientsData.length);
        console.log('📋 Structure du premier client:', JSON.stringify(clientsData[0], null, 2));
        
        setClients(clientsData);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des entreprises:', error);
        // Créer quelques clients de test en cas d'erreur
        const testClients: Client[] = [
          {
            id: 'test1',
            businessName: 'Client Test 1',
            contactName: 'Jean Dupont',
            email: 'jean@example.com',
            phone: '0123456789',
            address: '123 Rue Test',
            city: 'Paris',
            postalCode: '75000',
            country: 'France',
            createdAt: Date.now(),
            status: 'active',
            notes: 'Client de test créé suite à une erreur',
            businessId: 'test1',
            isInTrial: false
          }
        ];
        console.log('🔄 Utilisation de clients de test:', testClients.length);
        setClients(testClients);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [refreshTrigger]);

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      setClients(clients.filter(client => client.id !== clientId));
      setDeleteConfirmation(null);
      // Déclencher un rafraîchissement de la liste après suppression
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  };

  // Filtrer les clients en fonction du terme de recherche
  const filteredClientsList = clients.filter(client => 
    client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-end items-center mb-6">
        <button 
          onClick={onAddNewClient}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un client
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredClientsList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client enregistré.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientsList.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.businessName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.contactName}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(client.status)}`}>
                      {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center justify-end space-x-3">
                    {/* Bouton de configuration Viva Payments */}
                    <div className="mr-2">
                      <VivaConfigButton 
                        client={client} 
                        onConfigCreated={() => setRefreshTrigger(prev => prev + 1)}
                        onConfigUpdated={() => setRefreshTrigger(prev => prev + 1)}
                      />
                    </div>
                    
                    {/* Boutons d'actions existants */}
                    <button 
                      onClick={() => onEditClient(client)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                    {deleteConfirmation === client.id ? (
                      <>
                        <button 
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Confirmer
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmation(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirmation(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsList;
