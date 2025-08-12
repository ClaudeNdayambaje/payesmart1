import React, { useState } from 'react';
import { LoyaltyCard, LoyaltyTier } from '../types';
import { Search, Plus, Award, Edit, Trash2, CreditCard, Mail, Phone, Calendar, User, Filter, ArrowUpDown, Settings, Percent, Star, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LoyaltyManagerProps {
  loyaltyCards: LoyaltyCard[];
  loyaltyTiers: LoyaltyTier[];
  onCreateCard: (card: Omit<LoyaltyCard, 'id' | 'points' | 'tier' | 'createdAt'>) => void;
  onUpdateCard: (id: string, updates: Partial<LoyaltyCard>) => void;
  onDeleteCard: (id: string) => void;
  onUpdateLoyaltyTier: (name: LoyaltyTier['name'], updates: Partial<LoyaltyTier>) => void;
  hasPermission: (permission: string) => boolean;
}

const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({
  loyaltyCards,
  loyaltyTiers,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onUpdateLoyaltyTier,
  hasPermission
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [sortField, setSortField] = useState<'customerName' | 'points' | 'createdAt'>('customerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterTier, setFilterTier] = useState<LoyaltyCard['tier'] | 'all'>('all');
  const [newCard, setNewCard] = useState({
    customerName: '',
    email: '',
    phone: '',
  });
  const [editCard, setEditCard] = useState({
    customerName: '',
    email: '',
    phone: '',
  });
  const [showTierSettings, setShowTierSettings] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<LoyaltyCard | null>(null);

  // Fonction utilitaire pour vérifier et formater les dates en toute sécurité
  const safeFormatDate = (dateValue: any, formatString: string) => {
    if (!dateValue) return 'N/A';
    
    try {
      if (dateValue instanceof Date) {
        return format(dateValue, formatString, { locale: fr });
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        return format(new Date(dateValue), formatString, { locale: fr });
      } else {
        return 'Date invalide';
      }
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  };

  // Filtrer et trier les cartes
  const filteredAndSortedCards = loyaltyCards
    .filter(card => {
      // Filtre de recherche
      const matchesSearch = 
        card.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.phone && card.phone.includes(searchQuery));
      
      // Filtre par niveau
      const matchesTier = filterTier === 'all' || card.tier === filterTier;
      
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      // Tri par champ sélectionné
      if (sortField === 'customerName') {
        return sortDirection === 'asc' 
          ? a.customerName.localeCompare(b.customerName)
          : b.customerName.localeCompare(a.customerName);
      } else if (sortField === 'points') {
        return sortDirection === 'asc' 
          ? a.points - b.points
          : b.points - a.points;
      } else if (sortField === 'createdAt') {
        return sortDirection === 'asc' 
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      }
      return 0;
    });

  const handleCreateCard = () => {
    if (!newCard.customerName || !newCard.email) return;

    onCreateCard({
      customerName: newCard.customerName,
      email: newCard.email,
      phone: newCard.phone,
      number: `LC${Date.now().toString().slice(-8)}`,
      businessId: 'business1'
    });

    setShowCreateForm(false);
    setNewCard({
      customerName: '',
      email: '',
      phone: '',
    });
  };

  const handleEditCard = () => {
    if (!selectedCard || !editCard.customerName || !editCard.email) return;

    onUpdateCard(selectedCard.id, {
      customerName: editCard.customerName,
      email: editCard.email,
      phone: editCard.phone,
    });

    setShowEditForm(false);
    setSelectedCard(null);
  };

  const openEditForm = (card: LoyaltyCard) => {
    setSelectedCard(card);
    setEditCard({
      customerName: card.customerName,
      email: card.email,
      phone: card.phone || '',
    });
    setShowEditForm(true);
  };

  const getTierBadgeStyle = (tier: LoyaltyCard['tier']) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'silver':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600';
      case 'gold':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
      case 'platinum':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600';
    }
  };

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



  const toggleSort = (field: 'customerName' | 'points' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditTier = () => {
    if (!editingTier) return;
    
    onUpdateLoyaltyTier(editingTier.name, {
      minimumPoints: editingTier.minimumPoints,
      discountPercentage: editingTier.discountPercentage,
      pointsMultiplier: editingTier.pointsMultiplier
    });
    
    setShowTierSettings(false);
    setEditingTier(null);
  };

  const openTierSettings = (tier: LoyaltyTier) => {
    setEditingTier({...tier});
    setShowTierSettings(true);
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <Award className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Gestion des cartes de fidélité
          </h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto sm:ml-auto">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-3 w-full sm:w-auto">
              <div className="relative min-w-[180px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text-secondary)]" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              
              <div className="relative">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value as LoyaltyCard['tier'] | 'all')}
                  className="appearance-none w-full min-w-[180px] pl-3 pr-10 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                >
                  <option value="all">Tous les niveaux</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Argent</option>
                  <option value="gold">Or</option>
                  <option value="platinum">Platine</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-primary)] transition-colors gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle carte</span>
              </button>
          
              {hasPermission("loyalty.settings") && (
                <button
                  onClick={() => setShowTierSettings(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[color:var(--color-secondary)] hover:bg-[color:var(--color-secondary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-secondary)] transition-colors gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* KPI 1: Nombre total de cartes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg h-[90px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-full bg-indigo-600">
                <CreditCard size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Cartes de fidélité</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold dark:text-white m-0">{loyaltyCards.length}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">Cartes actives</span>
            </div>
          </div>

          {/* KPI 2: Points moyens */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg h-[90px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-full bg-yellow-500">
                <Star size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Points moyens</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold dark:text-white m-0">
                {loyaltyCards.length > 0 
                  ? Math.round(loyaltyCards.reduce((sum, card) => sum + card.points, 0) / loyaltyCards.length) 
                  : 0}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">Par carte de fidélité</span>
            </div>
          </div>

          {/* KPI 3: Répartition par niveaux */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg h-[90px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-full bg-amber-500">
                <Award size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Clients premium</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold dark:text-white m-0">
                {loyaltyCards.length > 0 
                  ? Math.round((loyaltyCards.filter(card => card.tier === 'gold' || card.tier === 'platinum').length / loyaltyCards.length) * 100)
                  : 0}%
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">Or et Platine</span>
            </div>
          </div>

          {/* KPI 4: Cartes récentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg h-[90px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-full bg-green-500">
                <Calendar size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Nouvelles cartes</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold dark:text-white m-0">
                {loyaltyCards.filter(card => {
                  const now = new Date();
                  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                  return card.createdAt >= thirtyDaysAgo;
                }).length}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">30 derniers jours</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-auto">
          {filteredAndSortedCards.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700">
              <Award className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucune carte de fidélité</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Commencez par créer une nouvelle carte de fidélité pour vos clients.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-primary)] transition-colors"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Nouvelle carte
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700 overflow-hidden mt-2">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('customerName')}
                  >
                    <div className="flex items-center">
                      Client
                      {sortField === 'customerName' && (
                        <ArrowUpDown className="ml-1 h-4 w-4 dark:text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('points')}
                  >
                    <div className="flex items-center">
                      Points
                      {sortField === 'points' && (
                        <ArrowUpDown className="ml-1 h-4 w-4 dark:text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Niveau
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Créée le
                      {sortField === 'createdAt' && (
                        <ArrowUpDown className="ml-1 h-4 w-4 dark:text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedCards.map((card) => (
                  <tr key={card.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${getTierBorderColor(card.tier)}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {card.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {card.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {card.email}
                        </div>
                        {card.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {card.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {card.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadgeStyle(card.tier)}`}>
                        {card.tier.charAt(0).toUpperCase() + card.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {safeFormatDate(card.createdAt, 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(card)}
                          className="text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)] transition-colors"
                        >
                          <Edit className="h-5 w-5 dark:text-[color:var(--color-primary-light)]" />
                        </button>
                        <button
                          onClick={() => {
                            setCardToDelete(card);
                            setShowDeleteConfirm(true);
                          }}
                          className="theme-danger-text hover:opacity-80"
                        >
                          <Trash2 className="h-5 w-5 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Modal pour créer une nouvelle carte */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="theme-primary p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center">
                  <CreditCard className="mr-3 h-6 w-6" />
                  Nouvelle carte de fidélité
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-white hover:opacity-80 transition-colors"
                >
                  <Trash2 size={24} />
                </button>
              </div>
              <p className="mt-2 text-indigo-100 text-sm">Créez une nouvelle carte de fidélité pour votre client</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du client *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={newCard.customerName}
                    onChange={(e) => setNewCard({ ...newCard, customerName: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nom complet du client"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={newCard.email}
                    onChange={(e) => setNewCard({ ...newCard, email: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={newCard.phone}
                    onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCard}
                disabled={!newCard.customerName || !newCard.email}
                className="bg-[color:var(--color-primary)] text-white px-6 py-3 rounded-lg hover:bg-[color:var(--color-primary-dark)] font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour modifier une carte */}
      {showEditForm && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-info p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center">
                  <Edit className="mr-3 h-6 w-6" />
                  Modifier la carte
                </h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-white hover:opacity-80 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="mt-2 text-white text-sm">Modifiez les informations de la carte de fidélité</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du client *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={editCard.customerName}
                    onChange={(e) => setEditCard({ ...editCard, customerName: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nom complet du client"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={editCard.email}
                    onChange={(e) => setEditCard({ ...editCard, email: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={editCard.phone}
                    onChange={(e) => setEditCard({ ...editCard, phone: e.target.value })}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    Numéro de carte
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCard.number}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Star className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                    Points
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCard.points}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Award className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                    Niveau
                  </span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadgeStyle(selectedCard.tier)}`}>
                    {selectedCard.tier.charAt(0).toUpperCase() + selectedCard.tier.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleEditCard}
                disabled={!editCard.customerName || !editCard.email}
                className="bg-[color:var(--color-info)] text-white px-6 py-3 rounded-lg hover:bg-[color:var(--color-info-dark)] font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour les paramètres des niveaux de fidélité */}
      {showTierSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Paramètres des niveaux de fidélité</h2>
              <button
                onClick={() => setShowTierSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loyaltyTiers.map(tier => (
                  <div key={tier.name} className={`p-4 rounded-lg border-l-4 border-l-${tier.color} shadow-md`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold capitalize dark:text-white">{tier.name}</h3>
                      <button 
                        onClick={() => openTierSettings(tier)}
                        className="text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)] transition-colors"
                      >
                        <Edit className="h-5 w-5 dark:text-indigo-400" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <Star className="h-4 w-4 mr-1 dark:text-gray-400" />
                          Points minimum:
                        </span>
                        <span className="font-medium dark:text-white">{tier.minimumPoints}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <Percent className="h-4 w-4 mr-1 dark:text-gray-400" />
                          Réduction:
                        </span>
                        <span className="font-medium dark:text-white">{tier.discountPercentage}%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <Star className="h-4 w-4 mr-1 dark:text-gray-400" />
                          Multiplicateur:
                        </span>
                        <span className="font-medium dark:text-white">x{tier.pointsMultiplier}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Comment fonctionnent les niveaux de fidélité?</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Les clients accumulent des points à chaque achat selon la formule: <span className="font-medium dark:text-white">1 point par euro × multiplicateur du niveau</span></li>
                  <li>Lorsqu'un client atteint le nombre de points minimum d'un niveau, il passe automatiquement à ce niveau</li>
                  <li>Chaque niveau offre un pourcentage de réduction sur les achats futurs</li>
                  <li>Plus le niveau est élevé, plus le multiplicateur de points est important, permettant d'accumuler des points plus rapidement</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex justify-end">
              <button
                onClick={() => setShowTierSettings(false)}
                className="bg-[color:var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour éditer un niveau spécifique */}
      {editingTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Éditer le niveau {editingTier.name}</h2>
              <button
                onClick={() => setEditingTier(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points minimum
                </label>
                <input
                  type="number"
                  value={editingTier.minimumPoints}
                  onChange={(e) => setEditingTier({ ...editingTier, minimumPoints: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Points minimum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pourcentage de réduction
                </label>
                <input
                  type="number"
                  value={editingTier.discountPercentage}
                  onChange={(e) => setEditingTier({ ...editingTier, discountPercentage: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Pourcentage de réduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Multiplicateur de points
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingTier.pointsMultiplier}
                  onChange={(e) => setEditingTier({ ...editingTier, pointsMultiplier: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Multiplicateur de points"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleEditTier}
                className="bg-[color:var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour confirmer la suppression */}
      {showDeleteConfirm && cardToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="theme-primary p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center">
                  <Trash2 className="mr-3 h-6 w-6" />
                  Confirmation
                </h2>
              </div>
              <p className="mt-2 text-white text-opacity-80 text-sm">Veuillez confirmer cette action</p>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="theme-danger-light p-3 rounded-full mr-4">
                  <Trash2 className="h-6 w-6 theme-danger-text" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Supprimer la carte de fidélité</h3>
                  <p className="text-gray-600 dark:text-gray-300">Vous êtes sur le point de supprimer cette carte.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="font-medium dark:text-white">{cardToDelete.customerName}</span>
                </div>
                <div className="flex items-center mb-2">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="dark:text-gray-300">{cardToDelete.email}</span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="dark:text-gray-300">{cardToDelete.number}</span>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-200 mb-2">Êtes-vous sûr de vouloir supprimer cette carte de fidélité ?</p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Cette action ne pourra pas être annulée.</p>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCardToDelete(null);
                }}
                className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteCard(cardToDelete.id);
                  setShowDeleteConfirm(false);
                  setCardToDelete(null);
                }}
                className="theme-primary text-white px-6 py-3 rounded-lg hover:opacity-80 font-medium shadow-md transition-all"
              >
                <span className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2 text-white" />
                  Supprimer
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyManager;
