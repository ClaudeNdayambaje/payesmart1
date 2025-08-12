import React, { useState, useEffect } from 'react';
import { getTrialClients, getTrialConversionRate } from '../../services/saasClientService';
import { Client } from '../../types/saas';
import DateDisplay from './DateDisplay';
import TrialConversionModal from './TrialConversionModal';

interface TrialClientsListProps {
  onViewDetails?: (client: Client) => void;
  searchTerm?: string;
  onSearchChange?: React.Dispatch<React.SetStateAction<string>>;
  onRefresh?: () => void;
  refreshTrigger?: number; // Ajout du déclencheur de rafraîchissement externe
}

const ModernTrialClientsList: React.FC<TrialClientsListProps> = ({ 
  onViewDetails, 
  searchTerm: externalSearchTerm,
  onSearchChange,
  onRefresh,
  refreshTrigger = 0 // Utiliser la valeur par défaut 0 si non fournie
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  // Cette variable sera utilisée dans une future implémentation de la recherche interne
  const [internalSearchTerm] = useState('');
  // État interne pour rafraîchir la liste
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  
  // Utiliser le terme de recherche externe s'il est fourni, sinon utiliser le terme interne
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // Fonction de gestion du changement de recherche
  const handleSearchChange = (term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      // Si la prop onSearchChange n'est pas fournie, utiliser l'état interne
      // setInternalSearchTerm(term); // Commenté car nous n'utilisons pas cette variable pour le moment
    }
  };
  
  // Fonction de gestion de l'actualisation
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Si la prop onRefresh n'est pas fournie, utiliser l'état interne
      setInternalRefreshTrigger(prev => prev + 1);
    }
  };
  const [sortBy, setSortBy] = useState<string>('remainingDays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [conversionRate, setConversionRate] = useState<{rate: number; convertedClients: number; totalTrialEnded: number}>({ rate: 0, convertedClients: 0, totalTrialEnded: 0 });

  // Utiliser à la fois le déclencheur externe et l'interne
  useEffect(() => {
    console.log('ModernTrialClientsList - Rafraîchissement déclenché:', { 
      externalTrigger: refreshTrigger, 
      internalTrigger: internalRefreshTrigger 
    });
    const fetchTrialClients = async () => {
      try {
        setLoading(true);
        const [trialClientsData, conversionRateData] = await Promise.all([
          getTrialClients(),
          getTrialConversionRate()
        ]);
        setClients(trialClientsData);
        setConversionRate(conversionRateData);
      } catch (error) {
        console.error('Erreur lors de la récupération des clients en période d\'essai:', error);
        // Données de test en cas d'erreur
        const testClients: Client[] = [
          {
            id: 'trial1',
            businessName: 'Proximus Shop',
            contactName: 'Aubain Minaku',
            email: 'am@proximus.be',
            phone: '0456788987',
            address: '123 Rue du Commerce',
            city: 'Bruxelles',
            postalCode: '1000',
            country: 'Belgique',
            createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000, // 9 jours avant
            status: 'active',
            notes: 'Client en période d\'essai',
            businessId: 'trial1',
            isInTrial: true,
            trialStartDate: Date.now() - 9 * 24 * 60 * 60 * 1000,
            trialEndDate: Date.now() + 6 * 24 * 60 * 60 * 1000 // 6 jours restants
          },
          {
            id: 'trial2',
            businessName: 'Café des Arts',
            contactName: 'Marie Dubois',
            email: 'marie@cafedesarts.be',
            phone: '0478123456',
            address: '45 Avenue des Arts',
            city: 'Namur',
            postalCode: '5000',
            country: 'Belgique',
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 jours avant
            status: 'active',
            notes: 'Nouveau client en essai',
            businessId: 'trial2',
            isInTrial: true,
            trialStartDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
            trialEndDate: Date.now() + 13 * 24 * 60 * 60 * 1000 // 13 jours restants
          },
          {
            id: 'trial3',
            businessName: 'Librairie Page',
            contactName: 'Jean Martin',
            email: 'jean@librairiepage.be',
            phone: '0498765432',
            address: '78 Rue des Livres',
            city: 'Liège',
            postalCode: '4000',
            country: 'Belgique',
            createdAt: Date.now() - 13 * 24 * 60 * 60 * 1000, // 13 jours avant
            status: 'active',
            notes: 'Essai presque terminé',
            businessId: 'trial3',
            isInTrial: true,
            trialStartDate: Date.now() - 13 * 24 * 60 * 60 * 1000,
            trialEndDate: Date.now() + 2 * 24 * 60 * 60 * 1000 // 2 jours restants
          }
        ];
        setClients(testClients);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialClients();
  }, [refreshTrigger, internalRefreshTrigger]); // Dépendre des deux sources de rafraîchissement

  // Calculer le nombre de jours restants dans la période d'essai
  const calculateRemainingDays = (endDate: number): number => {
    const now = Date.now();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Obtenir la classe CSS pour la barre de progression
  const getProgressBarClass = (remainingDays: number): string => {
    if (remainingDays <= 3) return 'bg-red-500';
    if (remainingDays <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Filtrer les clients en fonction du terme de recherche
  const filteredClientsList = clients.filter(client => 
    client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Trier les clients
  const sortedClients = [...filteredClientsList].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'businessName':
        comparison = a.businessName.localeCompare(b.businessName);
        break;
      case 'contactName':
        comparison = a.contactName.localeCompare(b.contactName);
        break;
      case 'remainingDays':
        const daysA = calculateRemainingDays(a.trialEndDate || 0);
        const daysB = calculateRemainingDays(b.trialEndDate || 0);
        comparison = daysA - daysB;
        break;
      case 'startDate':
        comparison = (a.trialStartDate || 0) - (b.trialStartDate || 0);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' 
      ? <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
      : <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
  };

  // Utilisation des fonctions de formatage de date importées

  return (
    <div className="overflow-hidden">
      
      {/* Section KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-[color:var(--color-primary-light)] p-3 mr-4">
            <svg className="w-6 h-6 text-[color:var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Essais en cours</p>
            <p className="text-2xl font-bold text-gray-800">
              {clients.filter(client => client.isInTrial && client.trialEndDate && client.trialEndDate > Date.now()).length}
            </p>
            <p className="text-xs text-[color:var(--color-primary)]">
              Période d'essai active
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Essais critiques</p>
            <p className="text-2xl font-bold text-gray-800">
              {clients.filter(client => calculateRemainingDays(client.trialEndDate || 0) <= 3).length}
            </p>
            <p className="text-xs text-amber-600">
              3 jours ou moins restants
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Taux de conversion</p>
            <p className="text-2xl font-bold text-gray-800">
              {conversionRate.rate}%
            </p>
            <p className="text-xs text-green-600">
              {conversionRate.convertedClients}/{conversionRate.totalTrialEnded} dans les 30 derniers jours
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Essais Expirés</p>
            <p className="text-2xl font-bold text-gray-800">
              {clients.filter(client => client.isInTrial && client.trialEndDate && client.trialEndDate < Date.now()).length}
            </p>
            <p className="text-xs text-red-600">
              Période d'essai terminée
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
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun client en essai</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Aucun client en essai ne correspond à votre recherche.' : 'Aucun client en période d\'essai actuellement.'}
          </p>
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('remainingDays')}
                >
                  <div className="flex items-center">
                    Période d'essai {getSortIcon('remainingDays')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedClients.map(client => {
                const remainingDays = calculateRemainingDays(client.trialEndDate || 0);
                const progressBarClass = getProgressBarClass(remainingDays);
                const progressPercent = Math.max(0, Math.min(100, (remainingDays / 15) * 100));
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center font-bold">
                          {client.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.businessName}</div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Essai
                          </span>
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
                    <td className="px-6 py-4">
                       <div className={`text-sm font-medium ${remainingDays <= 3 ? 'text-red-600' : remainingDays <= 7 ? 'text-yellow-600' : 'text-green-600'} mb-1`}>
                        {remainingDays} jours restants
                        {client.trialInfo && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {client.trialInfo.trialPeriodName}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${progressBarClass} h-2.5 rounded-full`} 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Début: <DateDisplay timestamp={client.trialStartDate || 0} /></span>
                        <span>Fin: <DateDisplay timestamp={client.trialEndDate || 0} /></span>
                      </div>
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
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Contacter"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Convertir en abonnement"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsConversionModalOpen(true);
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {isConversionModalOpen && (
        <TrialConversionModal 
          client={selectedClient} 
          isOpen={isConversionModalOpen} 
          onClose={() => setIsConversionModalOpen(false)} 
          onConversionSuccess={() => setInternalRefreshTrigger(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default ModernTrialClientsList;
