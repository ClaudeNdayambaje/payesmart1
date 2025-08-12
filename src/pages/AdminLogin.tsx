import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/custom-login.css'; // Import des styles personnalisés pour la page de connexion

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Vérifier si l'utilisateur vient d'une déconnexion
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('source');
      
      // Utiliser uniquement Firebase Auth pour l'authentification
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      const { default: app } = await import('../firebase');
      const auth = getAuth(app);
      
      // Authentification avec Firebase
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Connexion Firebase réussie');
      
      // Redirection vers l'interface d'administration uniquement si ce n'est pas après une déconnexion
      if (source !== 'admin_logout') {
        setTimeout(() => {
          navigate('/admin');
        }, 500);
      }
      
      // Stocker explicitement le jeton d'authentification dans localStorage
      localStorage.setItem('payesmart_admin_auth', 'true');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(error.message || 'Erreur d\'authentification. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ps-login-background flex items-center justify-center p-6">
      <div className="ps-login-container rounded-xl shadow-2xl p-8 max-w-md w-full backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="PayeSmart Logo" className="h-14 filter brightness-110" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--ps-orange)] tracking-wider">PayeSmart Admin</h1>
        
        {error && (
          <div className="ps-error-box px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 px-4 py-3 ps-input rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ps-orange)] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 px-4 py-3 ps-input rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ps-orange)] focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full ps-btn-primary text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion en cours...
              </div>
            ) : (
              <>
                <span>Se connecter</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Pour accéder à l'interface d'administration, veuillez contacter votre administrateur système.
            </p>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <a 
            href="/marketing/index.html" 
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white ps-btn-secondary transition-all duration-300 group"
          >
            <svg className="w-5 h-5 mr-2 text-[var(--ps-orange)] group-hover:text-[var(--ps-orange-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la page d'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
