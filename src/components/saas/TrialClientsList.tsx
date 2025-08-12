import React, { useState, useEffect } from 'react';
import { getTrialClients } from '../../services/saasClientService';
import { Client } from '../../types/saas';

interface TrialClientsListProps {
  onViewDetails?: (client: Client) => void;
}

const TrialClientsList: React.FC<TrialClientsListProps> = ({ onViewDetails }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchTrialClients = async () => {
      try {
        setLoading(true);
        const trialClientsData = await getTrialClients();
        setClients(trialClientsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des clients en période d\'essai:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialClients();
  }, [refreshTrigger]);

  // Filtrer les clients en fonction du terme de recherche
  const filteredClientsList = clients.filter(client => 
    client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Clients en période d'essai (15 jours)</h2>
        <button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Actualiser
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un client en essai..."
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
          {searchTerm ? 'Aucun client en essai ne correspond à votre recherche.' : 'Aucun client en période d\'essai actuellement.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période d'essai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientsList.map(client => {
                const remainingDays = calculateRemainingDays(client.trialEndDate || 0);
                const progressBarClass = getProgressBarClass(remainingDays);
                const progressPercent = Math.max(0, Math.min(100, (remainingDays / 15) * 100));
                
                return (
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 mb-1">
                        {remainingDays} jours restants
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${progressBarClass} h-2.5 rounded-full`} 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Fin le {new Date(client.trialEndDate || 0).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => onViewDetails && onViewDetails(client)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrialClientsList;
