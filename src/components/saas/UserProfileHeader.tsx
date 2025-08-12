import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { verifyUserAuthorization, forceLogout } from '../../services/securityService';

interface UserProfileHeaderProps {
  className?: string;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ className = '' }) => {
  // État pour stocker les données utilisateur
  const [userData, setUserData] = useState({
    name: 'Admin PayeSmart',
    email: 'admin@payesmart.com',
    role: 'Administrateur',
    avatarUrl: '',
    avatarBase64: ''
  });
  const [isAuthorized, setIsAuthorized] = useState(true);
  const navigate = useNavigate();

  // Générer les initiales à partir du nom
  const initials = userData.name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();

  // Fonction pour déconnecter l'utilisateur non autorisé
  const logoutUnauthorizedUser = async () => {
    console.error('Utilisateur non autorisé détecté - Déconnexion forcée');
    await forceLogout(); // Utiliser le service de sécurité pour la déconnexion
    setIsAuthorized(false);
    
    // Rediriger vers la page de connexion
    setTimeout(() => {
      navigate('/login');
      window.location.reload(); // Forcer le rechargement complet de la page
    }, 500);
  };

  // Effet pour charger les données utilisateur depuis Firebase et localStorage
  useEffect(() => {
    const loadUserData = async () => {
      // Récupérer l'email de l'utilisateur connecté depuis localStorage
      const storedEmail = localStorage.getItem('payesmart_admin_email');
      const currentUser = auth.currentUser;
      const email = currentUser?.email || storedEmail;
      
      // Si aucun utilisateur n'est connecté ou pas d'email stocké, déconnecter
      if (!email) {
        console.warn('Aucun utilisateur connecté et aucun email stocké');
        logoutUnauthorizedUser();
        return;
      }
      
      try {
        // Vérifier l'autorisation de l'utilisateur avec le service de sécurité
        const authResult = await verifyUserAuthorization(email);
        
        if (!authResult.authorized) {
          console.error(`Utilisateur non autorisé: ${authResult.reason}`);
          logoutUnauthorizedUser();
          return;
        }
        
        // Utilisateur autorisé, récupérer ses données
        const user = authResult.user;
        
        if (user) {
          // S'assurer que l'email est enregistré dans localStorage
          if (currentUser?.email && currentUser.email !== storedEmail) {
            localStorage.setItem('payesmart_admin_email', currentUser.email);
          }
          
          // Ajouter un timestamp pour éviter les problèmes de cache avec l'avatar
          const avatarUrl = user.avatarUrl ? 
            `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : 
            '';
            
          // Récupérer l'avatar base64 s'il existe
          const avatarBase64 = user.avatarBase64 || '';
          
          // Mettre à jour les données utilisateur
          setUserData({
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin PayeSmart',
            email: user.email,
            role: user.role || 'Administrateur',
            avatarUrl: avatarUrl,
            avatarBase64: avatarBase64
          });
          
          console.log('Profil utilisateur chargé:', {
            ...user,
            avatarUrl: avatarUrl || 'Pas d\'avatar',
            avatarBase64: avatarBase64 ? 'Présent (base64)' : 'Absent'
          });
          
          // Utilisateur authentifié avec succès
          setIsAuthorized(true);
        } else {
          console.error('Utilisateur autorisé mais aucune donnée utilisateur retournée');
          logoutUnauthorizedUser();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        logoutUnauthorizedUser();
      }
    };
    
    // Charger les données utilisateur au démarrage
    loadUserData();
    
    // Configurer un intervalle pour vérifier l'autorisation toutes les 5 minutes
    const refreshInterval = setInterval(loadUserData, 5 * 60 * 1000);
    
    // Écouter les changements d'authentification
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      } else {
        // Si l'utilisateur est déconnecté de Firebase Auth
        logoutUnauthorizedUser();
      }
    });
    
    // Nettoyer les écouteurs et l'intervalle lors du démontage du composant
    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  // Si l'utilisateur n'est pas autorisé, ne rien afficher
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={className}>
      {/* Avatar avec initiales ou image */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          position: 'relative',
          marginBottom: '12px'
        }}>
          {/* Cercle d'avatar avec effet de lueur */}
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
            opacity: 0.6,
            filter: 'blur(4px)',
            zIndex: 0
          }}></div>
          
          {/* Avatar avec image ou initiales */}
          {userData.avatarBase64 ? (
            <div style={{
              position: 'relative',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: '2px solid #6366f1',
              overflow: 'hidden',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
              zIndex: 1
            }}>
              <img 
                src={userData.avatarBase64} 
                alt={userData.name} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.error('Erreur de chargement de l\'avatar base64:', e);
                  // En cas d'erreur, essayer l'URL de l'avatar
                  if (userData.avatarUrl) {
                    e.currentTarget.src = userData.avatarUrl;
                  } else {
                    // Si pas d'URL non plus, masquer l'image
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            </div>
          ) : userData.avatarUrl ? (
            <div style={{
              position: 'relative',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: '2px solid #6366f1',
              overflow: 'hidden',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
              zIndex: 1
            }}>
              <img 
                src={userData.avatarUrl} 
                alt={userData.name} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.error('Erreur de chargement de l\'avatar:', e);
                  // En cas d'erreur, masquer l'image et afficher les initiales
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div style={{
              position: 'relative',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: '2px solid #6366f1',
              background: 'linear-gradient(135deg, #4338ca, #3730a3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 600,
              color: 'white',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
              zIndex: 1
            }}>
              {initials}
            </div>
          )}
          
          {/* Indicateur de statut en ligne */}
          <div style={{
            position: 'absolute',
            bottom: '1px',
            right: '1px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: '1.5px solid #1e1b4b',
            zIndex: 2
          }}></div>
        </div>
        
        {/* Nom et informations */}
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'white',
            marginBottom: '4px'
          }}>
            {userData.name}
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#a5b4fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;
