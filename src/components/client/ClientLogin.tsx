import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { loginClient, resetPassword } from '../../services/clientAuthService';
import { AlertCircle, Loader2, CheckCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import '../../styles/custom-login.css'; // Import des styles personnalisés pour la page de connexion

interface ClientLoginProps {
  onSuccess: () => void;
  onRegister: () => void;
}

const ClientLogin: React.FC<ClientLoginProps> = ({ onSuccess, onRegister }) => {
  // Force l'affichage du modal d'abonnement pour débogage
  React.useEffect(() => {
    // Afficher le modal d'abonnement après 1 seconde pour les tests
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('testModal') === 'true') {
      setTimeout(() => {
        console.log('Affichage forcé du modal d\'abonnement pour test');
        setSubscriptionMessage('Votre abonnement a expiré depuis le 01/01/2025. Veuillez le renouveler pour continuer à utiliser l\'application.');
        setSubscriptionStatusCode('subscription_expired');
        setSubscriptionEndDate(new Date('2025-01-01'));
        setShowSubscriptionModal(true);
      }, 1000);
    }
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionStatusCode, setSubscriptionStatusCode] = useState('no_subscription');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | undefined>(undefined);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Test pour les différents types d'abonnements
    if (email === 'test@test.com') {
      if (password === 'expired') {
        // Simuler un abonnement expiré
        setSubscriptionMessage('Votre abonnement a expiré depuis le 01/01/2025. Veuillez le renouveler pour continuer à utiliser l\'application.');
        setSubscriptionStatusCode('subscription_expired');
        setSubscriptionEndDate(new Date('2025-01-01'));
        setShowSubscriptionModal(true);
        return;
      } else if (password === 'trial') {
        // Simuler une période d'essai expirée
        setSubscriptionMessage('Votre période d\'essai a pris fin. Pour continuer à utiliser l\'application, merci de choisir une formule d\'abonnement.');
        setSubscriptionStatusCode('trial_expired');
        setShowSubscriptionModal(true);
        return;
      } else if (password === 'none') {
        // Simuler aucun abonnement
        setSubscriptionMessage('Vous ne disposez pas d\'un abonnement actif. Veuillez souscrire à une formule pour accéder à l\'application.');
        setSubscriptionStatusCode('no_subscription');
        setShowSubscriptionModal(true);
        return;
      }
    }
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setLoading(true);
      await loginClient(email, password);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      console.error('Erreur de connexion détectée dans ClientLogin:', err);
      console.log('Type d\'erreur:', err.code, 'Message:', err.message, 'Statut:', err.statusCode);
      
      // Vérifier si c'est une erreur d'abonnement
      if (err.code === 'auth/subscription-required') {
        console.log('Erreur d\'abonnement détectée avec code spécifique');
        
        // Erreur liée à l'absence d'abonnement ou de période d'essai
        setSubscriptionMessage(err.message);
        
        // Récupérer le code de statut
        const statusCode = err.statusCode || 'no_subscription';
        setSubscriptionStatusCode(statusCode);
        
        // Récupérer la date d'expiration si disponible
        if (err.subscriptionEndDate) {
          console.log('Date d\'expiration trouvée:', err.subscriptionEndDate);
          setSubscriptionEndDate(new Date(err.subscriptionEndDate));
        } else if (statusCode === 'subscription_expired') {
          // Essayer d'extraire la date du message
          console.log('Tentative d\'extraction de la date du message:', err.message);
          const dateMatch = err.message.match(/expiré depuis le (\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch && dateMatch[1]) {
            const [day, month, year] = dateMatch[1].split('/');
            console.log('Date extraite du message:', day, month, year);
            setSubscriptionEndDate(new Date(`${year}-${month}-${day}`));
          } else {
            // Utiliser une date par défaut pour les tests
            console.log('Utilisation d\'une date par défaut');
            setSubscriptionEndDate(new Date());
          }
        }
        
        console.log('Affichage du modal d\'abonnement avec:', { 
          message: err.message, 
          statusCode: statusCode,
          endDate: err.subscriptionEndDate
        });
        
        // Forcer un délai pour s'assurer que les états sont mis à jour
        setTimeout(() => {
          console.log('Affichage forcé du modal après délai');
          setShowSubscriptionModal(true);
        }, 100);
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect');
      } else if (err.code === 'auth/user-disabled') {
        setError('Ce compte a été désactivé');
      } else if (err.message) {
        console.log('Erreur de connexion standard:', err);
        // Vérifier si l'erreur est liée à l'absence d'abonnement (ancien format)
        if (err.message.includes('abonnement') || 
            err.message.includes('Vous n\'avez pas d\'abonnement') ||
            err.message.includes('période d\'essai') ||
            err.message.includes('expiré')) {
          console.log('Erreur liée à l\'abonnement détectée par le message');
          // Erreur liée à l'absence d'abonnement ou de période d'essai
          setSubscriptionMessage(err.message);
          
          // Extraire le code de statut s'il est disponible
          let statusCode = 'no_subscription';
          if (err.statusCode) {
            statusCode = err.statusCode;
          } else if (err.message.includes('période d\'essai a pris fin')) {
            statusCode = 'trial_expired';
          } else if (err.message.includes('abonnement a expiré')) {
            statusCode = 'subscription_expired';
          }
          
          // Extraire la date d'expiration si elle est mentionnée dans le message
          if (err.subscriptionEndDate) {
            setSubscriptionEndDate(new Date(err.subscriptionEndDate));
          } else if (statusCode === 'subscription_expired') {
            // Essayer d'extraire la date du message
            const dateMatch = err.message.match(/expiré depuis le (\d{2}\/\d{2}\/\d{4})/);
            if (dateMatch && dateMatch[1]) {
              const [day, month, year] = dateMatch[1].split('/');
              setSubscriptionEndDate(new Date(`${year}-${month}-${day}`));
            }
          }
          
          setSubscriptionStatusCode(statusCode);
          console.log('Affichage du modal d\'abonnement avec:', { message: err.message, statusCode });
          setShowSubscriptionModal(true);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    
    if (!resetEmail) {
      setResetError('Veuillez entrer votre adresse email');
      return;
    }
    
    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error('Erreur de réinitialisation:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('Aucun compte associé à cette adresse email');
      } else {
        setResetError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="ps-login-container p-4 sm:p-8 rounded-2xl shadow-xl max-w-md w-full backdrop-blur-sm transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
      {/* Pas de barre de progression */}
      {showResetPassword ? (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ps-orange)] mb-6 text-center">Réinitialiser le mot de passe</h2>
          
          {resetSent ? (
            <div className="text-center py-6 sm:py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="h-10 sm:h-12 w-10 sm:w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Email envoyé!</h3>
              <p className="text-gray-600 mb-6">
                Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>
              <button
                onClick={() => setShowResetPassword(false)}
                className="w-full ps-btn-primary text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <div className="ps-error-box px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{resetError}</span>
                </div>
              )}
              
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full ps-input rounded-xl pl-10 pr-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[var(--ps-orange)] focus:border-[var(--ps-orange)] transition-all shadow-sm text-sm sm:text-base"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="px-3 sm:px-4 py-2 sm:py-3 ps-btn-secondary rounded-xl text-white font-medium transition-all duration-300 hover:shadow-sm text-sm sm:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="ps-btn-primary text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl flex items-center justify-center min-w-[90px] sm:min-w-[100px] font-medium shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                >
                  {resetLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Envoyer'
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ps-orange)] mb-2 text-center">Bienvenue</h2>
          <p className="text-gray-300 text-center mb-6 text-sm sm:text-base">Connectez-vous pour accéder à votre compte</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="ps-error-box px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full ps-input rounded-xl pl-10 pr-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[var(--ps-orange)] focus:border-[var(--ps-orange)] transition-all shadow-sm text-sm sm:text-base"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-input rounded-xl pl-10 pr-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[var(--ps-orange)] focus:border-[var(--ps-orange)] transition-all shadow-sm text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-[var(--ps-orange)] hover:text-[var(--ps-orange-light)] hover:underline transition-all duration-300"
              >
                Mot de passe oublié?
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full ps-btn-primary text-white py-2 sm:py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center font-medium shadow-md hover:shadow-lg mt-4 group text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center">Se connecter <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" /></span>
              )}
            </button>
            
            <div className="text-center mt-6">
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-500/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#323232] text-sm text-white/70">ou</span>
                </div>
              </div>
              <p className="text-white/80 mt-2 text-sm sm:text-base">
                Vous n'avez pas de compte?{' '}
                <button
                  type="button"
                  onClick={onRegister}
                  className="text-[var(--ps-orange)] hover:text-[var(--ps-orange-light)] hover:underline font-medium transition-all duration-300"
                >
                  S'inscrire
                </button>
              </p>
              


            </div>
          </form>
        </>
      )}
      
      {/* Modal pour abonnement requis */}
      {/* Modal pour abonnement requis - Utilisation d'un div absolu pour s'assurer qu'il s'affiche */}
      {showSubscriptionModal && createPortal(
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999 
          }}
        >
          <div 
            style={{ 
              backgroundColor: 'var(--ps-dark-gray)', 
              borderRadius: '8px', 
              maxWidth: '500px', 
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              border: '1px solid #444'
            }}
          >
            <div style={{ backgroundColor: 'var(--ps-darker-gray)', padding: '16px', display: 'flex', alignItems: 'flex-start', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #444' }}>
              <div style={{ flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ps-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div style={{ marginLeft: '12px', flex: 1 }}>
                <h3 style={{ margin: 0, color: 'var(--ps-orange)', fontSize: '18px', fontWeight: 'bold' }}>Abonnement requis</h3>
              </div>
              <button 
                onClick={() => setShowSubscriptionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ps-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px', color: '#e0e0e0' }}>
                {subscriptionMessage || "Vous n'avez pas d'abonnement actif ni de période d'essai pour accéder au logiciel de caisse PayeSmart."}
              </div>
              
              <div style={{ backgroundColor: 'var(--ps-darker-gray)', padding: '16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #444' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ps-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <div style={{ marginLeft: '12px' }}>
                    {subscriptionStatusCode === 'no_subscription' && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0' }}>
                        Pour accéder au logiciel de caisse PayeSmart, vous devez disposer d'un abonnement actif.
                      </p>
                    )}
                    {subscriptionStatusCode === 'trial_expired' && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0' }}>
                        Votre période d'essai est terminée. Pour continuer à utiliser PayeSmart, veuillez souscrire à un abonnement.
                      </p>
                    )}
                    {subscriptionStatusCode === 'subscription_expired' && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0' }}>
                        {subscriptionEndDate ? 
                          `Votre abonnement a expiré depuis le ${subscriptionEndDate.toLocaleDateString('fr-FR')}. Veuillez le renouveler pour continuer à utiliser l'application.` :
                          `Votre abonnement a expiré. Pour continuer à utiliser PayeSmart, veuillez renouveler votre abonnement.`
                        }
                      </p>
                    )}
                    {(subscriptionStatusCode === 'error' || !subscriptionStatusCode) && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0' }}>
                        Pour accéder à votre compte, vous devez disposer d'un abonnement actif ou être en période d'essai.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  style={{ 
                    padding: '8px 16px', 
                    border: '1px solid #444', 
                    borderRadius: '6px', 
                    backgroundColor: 'var(--ps-darker-gray)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Fermer
                </button>
                
                <button
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    window.location.href = '/#/subscription-plans';
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    border: '1px solid transparent', 
                    borderRadius: '6px', 
                    backgroundColor: 'var(--ps-orange)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {subscriptionStatusCode === 'subscription_expired' ? 'Renouveler mon abonnement' : 
                   subscriptionStatusCode === 'trial_expired' ? 'Choisir un abonnement' : 
                   'Voir les formules d\'abonnement'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientLogin;
