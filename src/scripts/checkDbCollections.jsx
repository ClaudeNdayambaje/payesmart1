// Script pour vérifier les collections importantes de Firebase
import React from 'react';
import ReactDOM from 'react-dom/client';
import { checkCollection } from '../utils/dbChecker';
import { db } from '../firebase';

// Fonction qui exécute les vérifications
const DbChecker = () => {
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const checkCollections = async () => {
      try {
        setLoading(true);
        // Collections à vérifier
        const collectionsToCheck = [
          'subscriptions',
          'subscription_plans',
          'clients',
          'businesses'
        ];

        const results = {};
        for (const collectionName of collectionsToCheck) {
          results[collectionName] = await checkCollection(collectionName);
        }

        setResults(results);
      } catch (err) {
        console.error('Erreur lors de la vérification des collections:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkCollections();
  }, []);

  if (loading) return <div>Chargement des données...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Vérification des collections Firebase</h1>
      {Object.entries(results).map(([collectionName, data]) => (
        <div key={collectionName} style={{ marginBottom: '30px' }}>
          <h2>{collectionName} ({data?.length || 0} documents)</h2>
          {data && data.length > 0 ? (
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p>Aucune donnée trouvée</p>
          )}
        </div>
      ))}
    </div>
  );
};

// Monter l'application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DbChecker />
  </React.StrictMode>
);

export default DbChecker;
