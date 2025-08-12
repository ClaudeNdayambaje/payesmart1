import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AuthDebug: React.FC = () => {
  useEffect(() => {
    console.log('AuthDebug monté - vérifie les erreurs potentielles');
    
    // Vérifier si les variables CSS sont correctement définies
    const styles = getComputedStyle(document.documentElement);
    const psOrange = styles.getPropertyValue('--ps-orange');
    const psDarkerGray = styles.getPropertyValue('--ps-darker-gray');
    
    console.log('Variables CSS:', {
      psOrange,
      psDarkerGray
    });
    
    // Vérifier que Firebase est correctement initialisé
    try {
      // Importations dynamiques pour éviter des erreurs de référence
      import('../firebase').then(firebase => {
        console.log('Firebase importé avec succès');
        console.log('Firebase auth disponible:', !!firebase.auth);
      }).catch(err => {
        console.error('Erreur lors de l\'import de Firebase:', err);
      });
    } catch (error) {
      console.error('Erreur lors de la vérification Firebase:', error);
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#2F2F2F',
      color: 'white',
      padding: '20px'
    }}>
      <h1 style={{ color: '#F7941D', marginBottom: '20px' }}>Débogage de l'authentification</h1>
      
      <div style={{
        backgroundColor: '#232323',
        padding: '20px',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        marginBottom: '20px',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#F7941D', marginBottom: '10px', fontSize: '18px' }}>Informations de débogage</h2>
        <p>Cette page permet de vérifier si le rendu fonctionne correctement.</p>
        <p>Veuillez consulter la console du navigateur pour les détails.</p>
      </div>
      
      <div style={{
        backgroundColor: '#232323',
        padding: '20px',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        marginBottom: '20px',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#F7941D', marginBottom: '10px', fontSize: '18px' }}>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/auth" style={{
            backgroundColor: '#F7941D',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Page d'authentification
          </Link>
          
          <Link to="/" style={{
            backgroundColor: '#444',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
