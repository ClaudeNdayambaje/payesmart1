import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types/saas';
import FeaturesSelector from './FeaturesSelector';
import { Feature, getAllFeatures } from '../../services/featuresService';

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan;
  onSave: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  onCancel: () => void;
}

const defaultPlan: Omit<SubscriptionPlan, 'id'> = {
  name: '',
  description: '',
  price: 0,
  currency: 'EUR',
  billingCycle: 'monthly',
  features: [],
  active: true,
  createdAt: Date.now()
};

const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'id'>>(plan || defaultPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);
  
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true);
        const features = await getAllFeatures();
        setAllFeatures(features);
        
        // Convertir les noms de fonctionnalités en IDs si possible
        if (formData.features.length > 0) {
          const featureMap = new Map(features.map(f => [f.name.toLowerCase(), f.id]));
          const featureIds = formData.features
            .map(name => featureMap.get(name.toLowerCase()))
            .filter(id => id) as string[];
          
          setSelectedFeatureIds(featureIds);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des fonctionnalités:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };
    
    fetchFeatures();
  }, [formData.features]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value)
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Les fonctions addFeature et removeFeature ont été remplacées par le sélecteur de fonctionnalités

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du plan est requis';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Le prix ne peut pas être négatif';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convertir les IDs de fonctionnalités en leurs noms pour le stockage
      const featureNames = selectedFeatureIds
        .map(id => {
          const feature = allFeatures.find(f => f.id === id);
          return feature ? feature.name : null;
        })
        .filter(name => name) as string[];
      
      // Préparer le plan à sauvegarder
      const updatedPlan = {
        ...formData,
        features: featureNames
      };
      
      onSave(updatedPlan);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">{plan ? 'Modifier le plan' : 'Ajouter un plan'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du plan
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (€)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle de facturation
            </label>
            <select
              name="billingCycle"
              value={formData.billingCycle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="monthly">Mensuel</option>
              <option value="quarterly">Trimestriel</option>
              <option value="biannually">Semestriel</option>
              <option value="annually">Annuel</option>
            </select>
          </div>
          

        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={(e) => handleChange(e)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Plan actif
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fonctionnalités
          </label>
          
          {loadingFeatures ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <FeaturesSelector 
              selectedFeatures={selectedFeatureIds} 
              onChange={setSelectedFeatureIds} 
            />
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Fonctionnalités sélectionnées:</span> {selectedFeatureIds.length}
            </p>
          </div>
        </div>
        
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

export default SubscriptionPlanForm;
