import React, { useState, useEffect } from 'react';
import { Feature, getAllFeatures, initializeDefaultFeatures } from '../../services/featuresService';

interface FeaturesSelectorProps {
  selectedFeatures: string[];
  onChange: (features: string[]) => void;
}

const FeaturesSelector: React.FC<FeaturesSelectorProps> = ({ selectedFeatures, onChange }) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialiser les fonctionnalités par défaut s'il n'en existe pas
        await initializeDefaultFeatures();
        
        // Récupérer toutes les fonctionnalités
        const featuresData = await getAllFeatures();
        setFeatures(featuresData);
      } catch (error) {
        console.error('Erreur lors de la récupération des fonctionnalités:', error);
        setError('Impossible de charger les fonctionnalités. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  // Obtenir les catégories uniques
  const categories = ['all', ...Array.from(new Set(features.map(feature => feature.category)))];

  // Filtrer les fonctionnalités par catégorie et terme de recherche
  const filteredFeatures = features.filter(feature => 
    (selectedCategory === 'all' || feature.category === selectedCategory) &&
    (feature.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     feature.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Gérer la sélection/désélection d'une fonctionnalité
  const handleFeatureToggle = (featureId: string) => {
    if (selectedFeatures.includes(featureId)) {
      onChange(selectedFeatures.filter(id => id !== featureId));
    } else {
      onChange([...selectedFeatures, featureId]);
    }
  };

  // Sélectionner toutes les fonctionnalités d'une catégorie
  const handleSelectAllInCategory = (category: string) => {
    const featuresToAdd = features
      .filter(feature => category === 'all' || feature.category === category)
      .map(feature => feature.id);
    
    const newSelectedFeatures = [...new Set([...selectedFeatures, ...featuresToAdd])];
    onChange(newSelectedFeatures);
  };

  // Désélectionner toutes les fonctionnalités d'une catégorie
  const handleDeselectAllInCategory = (category: string) => {
    const featureIdsToRemove = features
      .filter(feature => category === 'all' || feature.category === category)
      .map(feature => feature.id);
    
    const newSelectedFeatures = selectedFeatures.filter(id => !featureIdsToRemove.includes(id));
    onChange(newSelectedFeatures);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium mb-4">Sélection des fonctionnalités</h3>
      
      <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher une fonctionnalité..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="md:w-1/3">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleSelectAllInCategory(selectedCategory)}
            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={() => handleDeselectAllInCategory(selectedCategory)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Tout désélectionner
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {selectedFeatures.length} fonctionnalité(s) sélectionnée(s)
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
        {filteredFeatures.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucune fonctionnalité ne correspond à votre recherche
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFeatures.map(feature => (
              <li key={feature.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`feature-${feature.id}`}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor={`feature-${feature.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {feature.name}
                      {feature.isCore && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Base
                        </span>
                      )}
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {feature.category}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <span className="font-medium">Note:</span> Les fonctionnalités marquées "Base" sont incluses dans tous les plans.
        </p>
      </div>
    </div>
  );
};

export default FeaturesSelector;
