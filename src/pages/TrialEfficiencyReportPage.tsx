import React, { useState } from 'react';
import TrialEfficiencyReport from '../components/saas/TrialEfficiencyReport';
import { History, Download, RefreshCw } from 'lucide-react';
import { getTrialPeriodAuditLogs } from '../services/auditLogService';
import UserProfileHeader from '../components/saas/UserProfileHeader';
import { auth } from '../firebase';

const TrialEfficiencyReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Fonction pour charger les journaux d'audit
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await getTrialPeriodAuditLogs();
      setAuditLogs(logs);
      setShowAuditLogs(true);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des journaux d\'audit:', error);
      setLoading(false);
    }
  };
  
  // Fonction pour exporter les données en CSV
  const exportReportData = () => {
    // Implémentation à venir
    alert('Fonctionnalité d\'exportation en cours de développement');
  };
  
  // Fonction pour formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Fonction pour obtenir la couleur en fonction du type d'action
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'activate':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Fonction pour obtenir le libellé de l'action
  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      case 'activate':
        return 'Activation';
      default:
        return actionType;
    }
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('payesmart_admin_auth');
      window.location.href = '/#/admin/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Barre latérale fixe */}
      <div className="w-56 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white min-h-screen shadow-lg fixed left-0 top-0 h-full z-10 overflow-y-auto flex flex-col">
        <div className="flex-grow">
          <div className="p-3 border-b border-indigo-800 flex flex-col items-center">
            <h1 className="text-lg font-bold">PayeSmart</h1>
            <p className="text-sm text-indigo-300">Administration</p>
          </div>
          
          <nav className="mt-4">
            <div className="px-3 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Principal
            </div>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
              </svg>
              Tableau de bord
            </a>
          </nav>
          
          <nav className="mt-4">
            <div className="px-3 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Gestion
            </div>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Clients
            </a>

            <a 
              href="/#/admin/trial-periods" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Périodes d'essai
            </a>
            
            <a 
              href="/#/admin/trial-clients" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Clients en essai
            </a>
            
            <a 
              href="/#/admin/trial-reports" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md"
            >
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Rapports d'efficacité
            </a>
          </nav>
        </div>
        
        {/* Profil de l'utilisateur connecté */}
        <div className="mt-auto border-t border-indigo-800/30">
          <div className="p-3">
            <UserProfileHeader className="text-white mb-3" />
            
            {/* Bouton de déconnexion */}
            <button 
              onClick={handleLogout}
              className="group relative flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-md transition-all duration-300 w-full text-sm shadow-md overflow-hidden"
              title="Déconnexion"
            >
              <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal avec marge à gauche pour compenser la barre latérale fixe */}
      <div className="ml-56 flex-1 p-8">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rapports d'efficacité des périodes d'essai</h1>
            <p className="text-gray-600 mt-1">
              Analysez les performances et les taux de conversion des différentes périodes d'essai
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={loadAuditLogs}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Historique des modifications</span>
            </button>
            
            <button 
              onClick={exportReportData}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
        
        {/* Afficher les journaux d'audit ou le rapport d'efficacité */}
        {showAuditLogs ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Historique des modifications</h2>
              <button 
                onClick={() => setShowAuditLogs(false)}
                className="px-3 py-1 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200 transition-colors text-sm"
              >
                Retour au rapport
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ressource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.actionType)}`}>
                          {getActionLabel(log.actionType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resourceName || log.resourceId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-indigo-600 hover:text-indigo-800">
                              Voir les détails
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Aucun journal d'audit trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <TrialEfficiencyReport />
        )}
      </div>
    </div>
  );
};

export default TrialEfficiencyReportPage;
