import React, { useState, useEffect } from 'react';
import { Subscription, SubscriptionPlan } from '../../types/saas';
import { Business } from '../../types';
import { getAllBusinesses } from '../../services/getAllBusinesses';
import { getSubscriptionPlans } from '../../services/subscriptionPlanService';

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSave: (subscription: Omit<Subscription, 'id'>) => void;
  onCancel: () => void;
}

const defaultSubscription: Omit<Subscription, 'id'> = {
  clientId: '',
  planId: '',
  startDate: Date.now(),
  endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // +30 jours par défaut
  status: 'active',
  autoRenew: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ subscription, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Subscription, 'id'>>(subscription || defaultSubscription);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    }
  }, [subscription]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les entreprises (vrais clients PayeSmart)
        const businessesData = await getAllBusinesses();
        setBusinesses(businessesData);
        
        // Récupérer les plans d'abonnement
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
        
        // Si c'est un nouvel abonnement et qu'il y a des entreprises et des plans, définir les valeurs par défaut
        if (!subscription && businessesData.length > 0 && plansData.length > 0) {
          setFormData(prev => ({
            ...prev,
            clientId: businessesData[0].id,
            planId: plansData[0].id
          }));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [subscription]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else if (name === 'planId') {
      // Lorsque le plan change, mettre à jour la date de fin en fonction de la durée du plan
      const selectedPlan = plans.find(plan => plan.id === value);
      if (selectedPlan) {
        let durationInDays = 30; // Par défaut 30 jours (mensuel)
        
        switch (selectedPlan.billingCycle) {
          case 'monthly':
            durationInDays = 30;
            break;
          case 'quarterly':
            durationInDays = 90;
            break;
          case 'biannually':
            durationInDays = 180;
            break;
          case 'annually':
            durationInDays = 365;
            break;
        }
        
        const newEndDate = new Date(formData.startDate).getTime() + durationInDays * 24 * 60 * 60 * 1000;
        
        setFormData({
          ...formData,
          planId: value,
          endDate: newEndDate
        });
      } else {
        setFormData({
          ...formData,
          planId: value
        });
      }
    } else if (name === 'startDate') {
      // Lorsque la date de début change, mettre à jour la date de fin en fonction de la durée du plan
      const startDate = new Date(value).getTime();
      const selectedPlan = plans.find(plan => plan.id === formData.planId);
      
      if (selectedPlan) {
        let durationInDays = 30; // Par défaut 30 jours (mensuel)
        
        switch (selectedPlan.billingCycle) {
          case 'monthly':
            durationInDays = 30;
            break;
          case 'quarterly':
            durationInDays = 90;
            break;
          case 'biannually':
            durationInDays = 180;
            break;
          case 'annually':
            durationInDays = 365;
            break;
        }
        
        const newEndDate = startDate + durationInDays * 24 * 60 * 60 * 1000;
        
        setFormData({
          ...formData,
          startDate,
          endDate: newEndDate
        });
      } else {
        setFormData({
          ...formData,
          startDate
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }
    
    if (!formData.planId) {
      newErrors.planId = 'Veuillez sélectionner un plan';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    } else if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        updatedAt: Date.now()
      });
    }
  };

  // Formater la date pour l'input de type date
  const formatDateForInput = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">{subscription ? 'Modifier l\'abonnement' : 'Ajouter un abonnement'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.clientId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">Sélectionner un client</option>
              {businesses.map(business => (
                <option key={business.id} value={business.id}>
                  {business.businessName} ({business.ownerFirstName} {business.ownerLastName})
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan d'abonnement
            </label>
            <select
              name="planId"
              value={formData.planId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.planId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">Sélectionner un plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price} € / {plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle}
                </option>
              ))}
            </select>
            {errors.planId && <p className="mt-1 text-sm text-red-500">{errors.planId}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              name="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              name="endDate"
              value={formatDateForInput(formData.endDate)}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulé</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
          
          <div className="flex items-center h-full pt-6">
            <input
              type="checkbox"
              name="autoRenew"
              checked={formData.autoRenew}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Renouvellement automatique
            </label>
          </div>
        </div>
        
        {formData.planId && plans.find(p => p.id === formData.planId) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-2">Détails du plan sélectionné</h3>
            {(() => {
              const selectedPlan = plans.find(p => p.id === formData.planId);
              if (!selectedPlan) return null;
              
              return (
                <div>
                  <p className="text-sm mb-2"><span className="font-medium">Description:</span> {selectedPlan.description}</p>
                  <p className="text-sm mb-2"><span className="font-medium">Prix:</span> {selectedPlan.price} € / {selectedPlan.billingCycle === 'monthly' ? 'mois' : selectedPlan.billingCycle}</p>
                  <p className="text-sm mb-2"><span className="font-medium">Utilisateurs max:</span> {selectedPlan.maxUsers === -1 ? 'Illimité' : selectedPlan.maxUsers}</p>
                  <p className="text-sm mb-2"><span className="font-medium">Magasins max:</span> {selectedPlan.maxStores === -1 ? 'Illimité' : selectedPlan.maxStores}</p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Fonctionnalités incluses:</p>
                    <ul className="text-sm list-disc list-inside">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriptionForm;
