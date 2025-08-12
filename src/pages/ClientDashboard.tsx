import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentBusiness, Business } from '../services/clientAuthService';
import { Loader2, Settings, User, Store } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // L'utilisateur est connecté, récupérer les informations de l'entreprise
        try {
          const businessData = await getCurrentBusiness();
          setBusiness(businessData);
        } catch (error) {
          console.error('Erreur lors de la récupération des informations de l\'entreprise:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Pas d'utilisateur connecté, rediriger vers la page de connexion
        navigate('/auth');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  

  
  const handleEnterApp = () => {
    // Rediriger vers l'application principale
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="flex items-center">
            <img src="/logo2.png" alt="Logo PayeSmart" className="h-10 w-auto" />
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {business?.ownerFirstName} {business?.ownerLastName}
            </p>
            <p className="text-xs text-gray-500">{business?.email}</p>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Panneau principal */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100 flex flex-col">
            <div className="flex items-center mb-3">
              <div className="bg-indigo-600 rounded-full p-2 mr-3">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Bienvenue, {business?.ownerFirstName}!
                </h2>
                <p className="text-gray-600 text-sm">
                  Votre espace {business?.businessName} est prêt
                </p>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center mb-2">
                  <Store className="h-4 w-4 text-indigo-500 mr-2" />
                  <h3 className="font-medium text-gray-800 text-sm">Entreprise</h3>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{business?.businessName}</p>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-1 ${business?.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-xs text-gray-500">
                      {business?.active ? 'Actif' : 'Inactif'} • {business?.plan === 'free' ? 'Plan gratuit' : business?.plan === 'basic' ? 'Plan basique' : 'Plan premium'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-indigo-500 mr-2" />
                  <h3 className="font-medium text-gray-800 text-sm">Propriétaire</h3>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{business?.ownerFirstName} {business?.ownerLastName}</p>
                  <p className="text-xs text-gray-500">{business?.email}</p>
                </div>
              </div>
              
              <div className="col-span-2">
                <button
                  onClick={handleEnterApp}
                  className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-all duration-300 group"
                >
                  <span className="font-medium">Accéder à PayeSmart</span>
                  <span className="text-white group-hover:translate-x-1 transition-transform duration-300">→</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Panneau latéral */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col">
            <div className="flex items-center mb-3">
              <div className="bg-indigo-100 rounded-full p-2 mr-2">
                <Settings className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-800">Options</h3>
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col">
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-all duration-300"
              >
                <span className="font-medium text-sm">Paramètres</span>
                <Settings className="h-4 w-4" />
              </button>
              
              <div className="flex-1 grid grid-cols-1 gap-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {business?.phone || 'Non spécifié'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Date de création</p>
                  <p className="text-sm font-medium text-gray-900">
                    {business?.createdAt ? new Date(business.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
