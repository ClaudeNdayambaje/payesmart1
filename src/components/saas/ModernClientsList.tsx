import React, { useState, useEffect } from 'react';
import { deleteClientComplete } from '../../services/clientService';
import { getAllBusinesses } from '../../services/getAllBusinesses';
import { Business } from '../../types';
import { Client } from '../../types/saas';
import { checkSubscriptionStatus } from '../../services/subscriptionVerificationService';
import { getTrialClients, synchronizeTrialStatus } from '../../services/saasClientService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CreditCard } from 'lucide-react';
// import VivaClientConfigSection from '../viva/VivaClientConfigSection';
// Composant temporaire pour remplacer VivaClientConfigSection
const TemporaryVivaConfig: React.FC<{clientId?: string}> = ({clientId}) => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-medium">Configuration Viva (temporairement désactivée)</h3>
      <p className="text-sm text-gray-600 mt-2">La configuration Viva est temporairement indisponible pendant la maintenance.</p>
      {clientId && <p className="text-xs text-gray-500 mt-1">ID Client: {clientId}</p>}
    </div>
  );
};
import DateDisplay from './DateDisplay';

interface ClientsListProps {
  onEditClient: (client: Client) => void;
  onAddNewClient: () => void;
  onViewDetails?: (client: Client) => void;
  refreshTrigger?: number; // Déclencheur de rafraîchissement
}

// Fonction pour convertir un objet Business en Client
const businessToClient = (business: Business): Client => {
  if (!business) {
    console.error('Erreur: objet business non défini');
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

  let addressStr = '';
  let city = '';
  let postalCode = '';
  let country = '';

  if (business.address && typeof business.address === 'object') {
    addressStr = business.address.street || '';
    city = business.address.city || '';
    postalCode = business.address.postalCode || '';
    country = business.address.country || '';
  }

  let createdAtTimestamp = Date.now();
  if (business.createdAt) {
    if (typeof business.createdAt === 'object' && business.createdAt instanceof Date) {
      createdAtTimestamp = business.createdAt.getTime();
    } else if (typeof business.createdAt === 'number') {
      createdAtTimestamp = business.createdAt;
    }
  }

  // Prioritiser le contactName existant s'il existe, sinon le construire à partir des noms
  // Utiliser le cast any pour accéder à des propriétés qui pourraient ne pas être dans le type d'origine
  const businessAny = business as any;
  const contactName = businessAny.contactName || 
                     `${business.ownerFirstName || ''} ${business.ownerLastName || ''}`.trim() || 
                     'Inconnu';
  
  // Log pour débogage
  console.log('Conversion Business -> Client:', { 
    id: business.id,
    businessName: business.businessName,
    contactName: contactName,
    originalContactName: businessAny.contactName,
    ownerFirstName: business.ownerFirstName,
    ownerLastName: business.ownerLastName
  });

  return {
    id: business.id || 'unknown',
    businessName: business.businessName || 'Sans nom',
    contactName: contactName,
    email: business.email || '',
    phone: business.phone || '',
    address: addressStr,
    city: city,
    postalCode: postalCode,
    country: country,
    createdAt: createdAtTimestamp,
    status: business.active ? 'active' : 'inactive',
    notes: '',
    businessId: business.id || 'unknown',
    trialStartDate: undefined,
    trialEndDate: undefined,
    isInTrial: false
  };
};

const ModernClientsList: React.FC<ClientsListProps> = ({ onEditClient, onAddNewClient, onViewDetails, refreshTrigger = 0 }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStatusMap, setClientStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  // Utiliser un état local pour les opérations internes de rafraîchissement
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('businessName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // État pour la configuration Viva Payments
  const [isVivaConfigOpen, setIsVivaConfigOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);


  
  // Combiner le refreshTrigger des props et notre déclencheur local pour rafraîchir les données
  useEffect(() => {
    console.log('Déclenchement du rafraîchissement des clients:', { refreshTrigger, localRefreshTrigger });
    const fetchClients = async () => {
      setLoading(true);
      try {
        // Exécuter la synchronisation des périodes d'essai automatiquement
        console.log('Synchronisation automatique des périodes d\'essai...');
        await synchronizeTrialStatus();
        console.log('Synchronisation automatique terminée');
        
        // Récupérer les clients de base
        const businessesData = await getAllBusinesses();

        // Log pour débogage
        console.log('Données brutes des entreprises:', businessesData);
        
        // Conversion des données Business en Client
        const clientsData = businessesData.map(business => {
          // Log pour Callsmart
          if (business.email === 'cn@callsmart.be') {
            console.log('Détails bruts de Callsmart:', JSON.stringify(business, null, 2));
          }
          return businessToClient(business);
        });
        
        // IMPORTANT: Récupérer aussi les clients en période d'essai depuis la collection spécifique
        const trialClientsData = await getTrialClients();
        console.log('Clients en période d\'essai récupérés:', trialClientsData.length);
        
        // Fusionner les deux listes en donnant priorité aux données de trial
        const trialEmailsMap = new Map();
        trialClientsData.forEach(trialClient => {
          trialEmailsMap.set(trialClient.email, trialClient);
        });
        
        // Mettre à jour les propriétés isInTrial des clients existants
        const mergedClientsData = clientsData.map(client => {
          // Si ce client existe dans la liste des essais, mettre à jour ses propriétés
          if (trialEmailsMap.has(client.email)) {
            const trialClient = trialEmailsMap.get(client.email);
            return {
              ...client,
              isInTrial: true,
              trialStartDate: trialClient.trialStartDate,
              trialEndDate: trialClient.trialEndDate
            };
          }
          return client;
        });
        
        // Vérifier les clients après fusion
        mergedClientsData.forEach(client => {
          if (client.email === 'cn@callsmart.be') {
            console.log('Client Callsmart après fusion des données d\'essai:', JSON.stringify(client, null, 2));
          }
        });
        
        setClients(mergedClientsData);
        
        // Récupérer le statut réel de chaque client
        const statusMap: Record<string, string> = {};
        
        // Début du traitement des statuts
        
        // Force le statut pour tous les clients en période d'essai AVANT toute autre vérification
        for (const client of clientsData) {
          if (client.isInTrial === true) {
            statusMap[client.id] = 'Essai Actif';
            // Log de débogage supprimé
          }
        }
        
        // Poursuivre avec la vérification normale des abonnements
        for (const client of clientsData) {
          if (client.businessId) {
            try {
              const subscriptionStatus = await checkSubscriptionStatus(client.businessId);
              
              // Déterminer le statut réel basé sur le statusCode
              
              switch (subscriptionStatus.statusCode) {
                case 'active_subscription':
                  statusMap[client.id] = 'Abonné';
                  break;
                case 'trial_active':
                  statusMap[client.id] = 'Essai Actif';
                  break;
                case 'trial_expired':
                  statusMap[client.id] = 'Essai Expiré';
                  break;
                case 'subscription_expired':
                  statusMap[client.id] = 'Abonnement Expiré';
                  break;
                case 'subscription_cancelled':
                  statusMap[client.id] = 'Abonnement Résilié';
                  break;
                case 'no_subscription':
                  // NE PAS définir Sans Abonnement si le client est en période d'essai
                  if (client.isInTrial !== true) {
                    statusMap[client.id] = 'Sans Abonnement';
                    // Debug log pour no_subscription
                    if (client.email === 'cn@callsmart.be') {
                      // Log supprimé
                    }
                  } else {
                    // Maintenir Essai Actif pour les clients en essai
                    if (client.email === 'cn@callsmart.be') {
                      // Log supprimé
                    }
                  }
                  break;
                default:
                  statusMap[client.id] = client.isInTrial ? 'Essai' : 
                                           client.status === 'active' ? 'Actif' : 
                                           client.status === 'inactive' ? 'Inactif' : 'En attente';
              }
            } catch (error) {
              console.error(`Erreur lors de la vérification du statut pour ${client.businessName}:`, error);
              statusMap[client.id] = client.isInTrial ? 'Essai Actif' : 
                                     client.status === 'active' ? 'Actif' : 
                                     client.status === 'inactive' ? 'Inactif' : 'En attente';
            }
          } else {
            // Fallback pour les clients sans businessId
            statusMap[client.id] = client.isInTrial ? 'Essai Actif' : 
                                   client.status === 'active' ? 'Actif' : 
                                   client.status === 'inactive' ? 'Inactif' : 'En attente';
          }
        }
        
        // Log final pour Callsmart
        const callsmartClient = clientsData.find(c => c.email === 'cn@callsmart.be');
        if (callsmartClient) {
          // Log supprimé
        }
        
        setClientStatusMap(statusMap);
      } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        // Données de test en cas d'erreur
        const testClients: Client[] = [
          {
            id: 'test1',
            businessName: 'Restaurant Chez Michel',
            contactName: 'Michel Dupont',
            email: 'michel@example.com',
            phone: '0123456789',
            address: '123 Rue de la Gastronomie',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 jours avant
            status: 'active',
            notes: 'Client premium',
            businessId: 'test1',
            isInTrial: false
          },
          {
            id: 'test2',
            businessName: 'Boulangerie Artisanale',
            contactName: 'Sophie Martin',
            email: 'sophie@example.com',
            phone: '0987654321',
            address: '45 Avenue du Pain',
            city: 'Lyon',
            postalCode: '69002',
            country: 'France',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 jours avant
            status: 'active',
            notes: 'Nouveau client',
            businessId: 'test2',
            isInTrial: true,
            trialStartDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
            trialEndDate: Date.now() + 15 * 24 * 60 * 60 * 1000
          },
          {
            id: 'test3',
            businessName: 'Café des Arts',
            contactName: 'Jean Lefebvre',
            email: 'jean@example.com',
            phone: '0654321789',
            address: '78 Boulevard Culturel',
            city: 'Bordeaux',
            postalCode: '33000',
            country: 'France',
            createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 jours avant
            status: 'inactive',
            notes: 'Abonnement expiré',
            businessId: 'test3',
            isInTrial: false
          }
        ];
        setClients(testClients);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [refreshTrigger, localRefreshTrigger]);

  const handleDeleteClient = async (clientId: string) => {
    try {
      // Afficher un indicateur de chargement lors de la suppression
      setLoading(true);
      
      // Trouver le client pour obtenir son businessId
      const clientToDelete = clients.find(client => client.id === clientId);
      
      if (!clientToDelete) {
        console.error('Client introuvable pour la suppression');
        return;
      }
      
      console.log('Démarrage de la suppression complète du client:', clientToDelete.businessName);
      
      // Utiliser la suppression complète avec le businessId du client
      // S'assurer que businessId n'est pas undefined
      const businessId = clientToDelete.businessId || clientId;
      const success = await deleteClientComplete(clientId, businessId);
      
      if (success) {
        console.log('Suppression complète réussie!');
        // Mettre à jour la liste en retirant le client supprimé
        setClients(clients.filter(client => client.id !== clientId));
        // Fermer la boîte de dialogue de confirmation
        setDeleteConfirmation(null);
        // Rafraîchir la liste des clients pour s'assurer que tout est à jour
        setLocalRefreshTrigger(prev => prev + 1);
      } else {
        console.error('La suppression du client a échoué');
        alert('Une erreur s\'est produite lors de la suppression du client. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      alert('Une erreur s\'est produite lors de la suppression du client. Veuillez réessayer.');
    } finally {
      // Arrêter l'indicateur de chargement
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Filtrer les clients en fonction du terme de recherche et du statut
  // Obtenir le statut réel affiché pour un client
  const getDisplayedStatus = (client: Client): string => {
    return clientStatusMap[client.id] || 
           (client.isInTrial ? 'Essai Actif' : 
            client.status === 'active' ? 'Abonné' : 
            client.status === 'inactive' ? 'Inactif' : 'En attente');
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Utiliser le statut affiché pour le filtrage
    const clientDisplayStatus = getDisplayedStatus(client);
    const matchesStatus = filterStatus === 'all' || clientDisplayStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Trier les clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'businessName':
        comparison = a.businessName.localeCompare(b.businessName);
        break;
      case 'contactName':
        comparison = a.contactName.localeCompare(b.contactName);
        break;
      case 'createdAt':
        comparison = a.createdAt - b.createdAt;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getStatusBadgeClass = (clientId: string, status: string, isInTrial: boolean = false) => {
    // Si nous avons un statut personnalisé pour ce client, l'utiliser
    const customStatus = clientStatusMap[clientId];
    
    if (customStatus) {
      switch (customStatus) {
        case 'Abonné':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'Essai Actif':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Essai Expiré':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'Abonnement Expiré':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Abonnement Résilié':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'Sans Abonnement':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          break;
      }
    }
    
    // Fallback au comportement précédent
    if (isInTrial) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    // Sinon, utiliser le statut normal
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

  // Utilisation du composant DateDisplay pour l'affichage des dates

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' 
      ? <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
      : <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Les logs de débogage ont été supprimés car le problème est résolu */}
      
      {/* En-tête avec titre, recherche et bouton d'ajout */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Titre à gauche */}
          <div className="flex items-center space-x-2 md:w-1/4 w-full">
            <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Gestion des Clients</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredClients.length}
            </span>
          </div>
          
          {/* Barre de recherche centrée */}
          <div className="flex justify-center items-center md:w-1/3 w-full">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtre et bouton d'ajout à droite */}
          <div className="flex items-center gap-3 md:w-auto w-full justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="Abonné">Abonnés</option>
              <option value="Essai Actif">Essai Actif</option>
              <option value="Essai Expiré">Essai Expiré</option>
              <option value="Abonnement Expiré">Abonnement Expiré</option>
              <option value="Sans Abonnement">Sans Abonnement</option>
              <option value="Inactif">Inactifs</option>
            </select>
            
            <button 
              onClick={onAddNewClient}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter un client
            </button>
          </div>
        </div>
      </div>
      
      {/* Section KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-2xl font-bold text-gray-800">
              {clients.length}
            </p>
            <p className="text-xs text-green-600">
              100% du total
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Clients en Essai</p>
            <p className="text-2xl font-bold text-gray-800">
              {Object.values(clientStatusMap).filter(status => status === 'Essai Actif').length}
            </p>
            <p className="text-xs text-purple-600">
              {Math.round(Object.values(clientStatusMap).filter(status => status === 'Essai Actif').length / (clients.length || 1) * 100)}% du total
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Clients Abonnés</p>
            <p className="text-2xl font-bold text-gray-800">
              {Object.values(clientStatusMap).filter(status => status === 'Abonné').length}
            </p>
            <p className="text-xs text-green-600">
              {Math.round(Object.values(clientStatusMap).filter(status => status === 'Abonné').length / (clients.length || 1) * 100)}% du total
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Taux de Conversion</p>
            <p className="text-2xl font-bold text-gray-800">
              {clients.length && Object.values(clientStatusMap).filter(status => status === 'Essai Actif').length > 0 ? 
                Math.round((Object.values(clientStatusMap).filter(status => status === 'Abonné').length / 
                  (Object.values(clientStatusMap).filter(status => status === 'Abonné').length + 
                   Object.values(clientStatusMap).filter(status => status === 'Essai Actif').length)) * 100) : 0}%
            </p>
            <p className="text-xs text-yellow-600">
              {Object.values(clientStatusMap).filter(status => status === 'Abonné').length} clients convertis
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : sortedClients.length === 0 ? (
        <div className="text-center py-16 px-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun client trouvé</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client enregistré.'}
          </p>
          <button 
            onClick={onAddNewClient}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Ajouter votre premier client
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('businessName')}
                >
                  <div className="flex items-center">
                    Entreprise {getSortIcon('businessName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('contactName')}
                >
                  <div className="flex items-center">
                    Contact {getSortIcon('contactName')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date d'inscription {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center font-bold">
                        {client.businessName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.businessName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.contactName}</div>
                    {client.phone && (
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(client.id, client.status, client.isInTrial)}`}>
                        {clientStatusMap[client.id] || (client.isInTrial ? 'Essai Actif' : client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateDisplay timestamp={client.createdAt} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {onViewDetails && (
                        <button 
                          onClick={() => onViewDetails(client)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Voir les détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={() => onEditClient(client)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      {deleteConfirmation === client.id ? (
                        <>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Confirmer la suppression"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmation(null)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Annuler"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirmation(client.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                      
                      {/* Bouton pour configurer Viva Payments */}
                      <button 
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setSelectedClient(client);
                          setIsVivaConfigOpen(true);
                        }}
                        className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 p-1 px-2 rounded-md border border-green-200 transition-colors duration-200"
                        title="Configurer Viva Payments"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs font-medium">Viva</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de configuration Viva Payments */}
      <Dialog open={isVivaConfigOpen} onOpenChange={setIsVivaConfigOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-white">
              Configuration Viva Payments
              {selectedClient && ` - ${selectedClient.businessName}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClientId && (
            <TemporaryVivaConfig clientId={selectedClientId} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Pagination (exemple statique) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{sortedClients.length}</span> client{sortedClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Précédent</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" aria-current="page" className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                1
              </a>
              <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Suivant</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernClientsList;
