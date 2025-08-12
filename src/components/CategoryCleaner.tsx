import React, { useState } from 'react';
import { cleanInvalidCategories, getCategories } from '../services/categoryService';

/**
 * Composant temporaire pour nettoyer les catégories invalides
 */
const CategoryCleaner: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    deleted: number;
    errors: number;
    remaining?: number;
    done: boolean;
  }>({ deleted: 0, errors: 0, done: false });

  const handleCleanCategories = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Nettoyer les catégories invalides
      console.log('🧹 Début du nettoyage des catégories invalides...');
      const cleanResult = await cleanInvalidCategories();
      
      // Récupérer les catégories restantes (maintenant valides)
      const validCategories = await getCategories();
      
      setResult({
        deleted: cleanResult.deleted,
        errors: cleanResult.errors,
        remaining: validCategories.length,
        done: true
      });
      
      console.log('✅ Nettoyage terminé avec succès!');
    } catch (error) {
      console.error('❌ Erreur pendant le nettoyage:', error);
      setResult({ 
        deleted: 0, 
        errors: 1,
        done: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="category-cleaner" style={{
      padding: '20px',
      margin: '20px 0',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: '0' }}>Nettoyage des catégories</h3>
      <p>Cet outil supprime les catégories invalides de la base de données.</p>
      
      {!result.done ? (
        <button 
          onClick={handleCleanCategories}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Nettoyage en cours...' : 'Nettoyer les catégories invalides'}
        </button>
      ) : (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: result.errors > 0 ? '#f44336' : '#4CAF50' }}>
            Résultats du nettoyage
          </h4>
          <ul>
            <li><strong>{result.deleted}</strong> catégories invalides supprimées</li>
            {result.errors > 0 && (
              <li style={{ color: '#f44336' }}><strong>{result.errors}</strong> erreurs rencontrées</li>
            )}
            {result.remaining !== undefined && (
              <li><strong>{result.remaining}</strong> catégories valides restantes</li>
            )}
          </ul>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Rafraîchir la page
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryCleaner;
