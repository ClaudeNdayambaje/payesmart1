import React, { useState } from 'react';
import { LoyaltyCard } from '../types';
import { CreditCard, X, Search, Plus, Award } from 'lucide-react';
import { format } from 'date-fns';

interface LoyaltyCardModalProps {
  onClose: () => void;
  onSelectCard: (card: LoyaltyCard) => void;
  onCreateCard: (card: Omit<LoyaltyCard, 'id' | 'points' | 'tier' | 'createdAt'>) => void;
  existingCards: LoyaltyCard[];
}

const LoyaltyCardModal: React.FC<LoyaltyCardModalProps> = ({
  onClose,
  onSelectCard,
  onCreateCard,
  existingCards,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCard, setNewCard] = useState({
    customerName: '',
    email: '',
    phone: '',
  });

  const filteredCards = existingCards.filter(
    card =>
      card.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cette fonction n'est plus utilisée, mais nous la gardons pour référence future
  // const getTierColor = (tier: LoyaltyCard['tier']) => {
  //   switch (tier) {
  //     case 'bronze':
  //       return 'bg-amber-600';
  //     case 'silver':
  //       return 'bg-gray-500';
  //     case 'gold':
  //       return 'bg-yellow-500';
  //     case 'platinum':
  //       return 'bg-indigo-600';
  //     default:
  //       return 'bg-gray-500';
  //   }
  // };

  const getTierBadgeStyle = (tier: LoyaltyCard['tier']) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'platinum':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Obtenir la couleur de bordure en fonction du niveau
  const getTierBorderColor = (tier: LoyaltyCard['tier']) => {
    switch (tier) {
      case 'bronze':
        return 'border-l-4 border-l-amber-600';
      case 'silver':
        return 'border-l-4 border-l-gray-500';
      case 'gold':
        return 'border-l-4 border-l-yellow-500';
      case 'platinum':
        return 'border-l-4 border-l-indigo-600';
      default:
        return 'border-l-4 border-l-gray-400';
    }
  };

  const handleCreateCard = () => {
    if (!newCard.customerName || !newCard.email) return;

    onCreateCard({
      customerName: newCard.customerName,
      email: newCard.email,
      phone: newCard.phone,
      number: `LC${Date.now().toString().slice(-8)}`,
      businessId: 'business1' // Ajout de l'ID de l'entreprise par défaut
    });

    setShowCreateForm(false);
    setNewCard({
      customerName: '',
      email: '',
      phone: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-xl w-full max-w-2xl relative z-50">
        <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="text-white" size={24} />
            <h2 className="text-xl font-semibold">Carte de fidélité</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 bg-white bg-opacity-20 p-1.5 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {!showCreateForm ? (
          <>
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher une carte..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-md transition-all duration-200"
                >
                  <Plus size={20} />
                  <span>Nouvelle carte</span>
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {filteredCards.length > 0 ? (
                <div className="space-y-4">
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      className={`w-full text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-0 hover:shadow-lg transition-all duration-200 overflow-hidden ${getTierBorderColor(card.tier)}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{card.customerName}</h3>
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${getTierBadgeStyle(card.tier)}`}>
                              <Award size={14} />
                              <span className="font-medium capitalize text-sm">{card.tier}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{card.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Carte n° {card.number}</p>
                          {card.lastUsed && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Dernière utilisation: {
                                (() => {
                                  try {
                                    // Vérifier si lastUsed est une date valide
                                    const date = card.lastUsed instanceof Date 
                                      ? card.lastUsed 
                                      : new Date(card.lastUsed);
                                    
                                    // Vérifier si la date est valide
                                    if (isNaN(date.getTime())) {
                                      return 'Date inconnue';
                                    }
                                    
                                    return format(date, 'dd/MM/yyyy');
                                  } catch (error) {
                                    console.error('Erreur de formatage de date:', error);
                                    return 'Date inconnue';
                                  }
                                })()
                              }
                            </p>
                          )}
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4 text-right">
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg font-bold text-xl">
                            {card.points} points
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Aucune carte trouvée</p>
                  <p className="text-sm">Essayez une autre recherche ou créez une nouvelle carte</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 space-y-5 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Nouvelle carte de fidélité</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du client
              </label>
              <input
                type="text"
                value={newCard.customerName}
                onChange={(e) =>
                  setNewCard({ ...newCard, customerName: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                placeholder="Nom complet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={newCard.email}
                onChange={(e) =>
                  setNewCard({ ...newCard, email: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={newCard.phone}
                onChange={(e) =>
                  setNewCard({ ...newCard, phone: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                placeholder="+32 123 45 67 89"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCard}
                disabled={!newCard.customerName || !newCard.email}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200"
              >
                Créer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyCardModal;