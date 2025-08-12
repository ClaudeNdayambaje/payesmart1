import React, { useEffect, useState } from 'react';
import { runAllChecks, CheckResult } from '../utils/checkFirebaseData';

const FirebaseChecker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkData = async () => {
      try {
        setLoading(true);
        const checkResults = await runAllChecks();
        // S'assurer que checkResults est du bon type
        if (checkResults && 'brokenSubscriptions' in checkResults && 'validSubscriptions' in checkResults) {
          setResults(checkResults as CheckResult);
        } else {
          console.warn('Format de résultats inattendu:', checkResults);
          setResults({
            brokenSubscriptions: [],
            validSubscriptions: []
          });
        }
      } catch (err: any) {
        console.error('Erreur lors de la vérification:', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    checkData();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Vérification des Données Firebase</h1>
      
      {loading && <p>Chargement des données...</p>}
      
      {error && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div>
          <h2>Résultats de la vérification</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Abonnements avec références invalides ({results.brokenSubscriptions?.length || 0})</h3>
            {results.brokenSubscriptions && results.brokenSubscriptions.length > 0 ? (
              <pre style={{ 
                background: '#ffdddd', 
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(results.brokenSubscriptions, null, 2)}
              </pre>
            ) : (
              <p>Aucun abonnement avec référence invalide trouvé.</p>
            )}
          </div>
          
          <div>
            <h3>Abonnements valides ({results.validSubscriptions?.length || 0})</h3>
            {results.validSubscriptions && results.validSubscriptions.length > 0 ? (
              <pre style={{ 
                background: '#ddffdd', 
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(results.validSubscriptions, null, 2)}
              </pre>
            ) : (
              <p>Aucun abonnement valide trouvé.</p>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Journaux de la console</h3>
        <p>Consultez la console du navigateur (F12) pour voir les logs détaillés.</p>
      </div>
    </div>
  );
};

export default FirebaseChecker;
