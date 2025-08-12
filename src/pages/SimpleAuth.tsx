import React from 'react';

// Composant d'authentification simplifié sans les éléments complexes
const SimpleAuth: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#2F2F2F',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#232323',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #444'
      }}>
        <h2 style={{
          color: '#F7941D',
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '24px'
        }}>Connexion PayeSmart</h2>
        
        <form>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#e0e0e0'
            }}>
              Email
            </label>
            <input
              type="email"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#333',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white'
              }}
              placeholder="votre@email.com"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#e0e0e0'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#333',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white'
              }}
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="button"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#F7941D',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            Se connecter
          </button>
        </form>
        
        <div style={{ 
          marginTop: '20px',
          textAlign: 'center',
          color: '#aaa',
          fontSize: '14px'
        }}>
          Vous n'avez pas de compte ?{' '}
          <a 
            href="#" 
            style={{ 
              color: '#F7941D',
              textDecoration: 'none'
            }}
          >
            S'inscrire
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;
