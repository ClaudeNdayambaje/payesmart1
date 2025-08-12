import React, { useState, useEffect } from 'react';
import { registerClient, ClientRegistrationData } from '../../services/clientAuthService';
import { AlertCircle, CheckCircle, Loader2, Mail, Building, User, Phone } from 'lucide-react';
import NewAccountInfoModal from './NewAccountInfoModal';

interface ClientRegistrationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<ClientRegistrationData>({
    email: '',
    password: '',
    businessName: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Vérifier si des informations de compte sont disponibles dans le localStorage
  useEffect(() => {
    const hasNewAccountInfo = localStorage.getItem('newAccountInfo') !== null;
    if (hasNewAccountInfo && success) {
      setShowInfoModal(true);
    }
  }, [success]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.email || !formData.password || !formData.businessName || !formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (formData.password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    try {
      setLoading(true);
      await registerClient(formData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      {showInfoModal && <NewAccountInfoModal onClose={() => {
        setShowInfoModal(false);
        onSuccess();
      }} />}
      
      <div className="ps-login-container p-6 rounded-2xl shadow-xl max-w-md w-full backdrop-blur-sm transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-[var(--ps-orange)] mb-1 text-center">Créer un compte</h2>
        <p className="text-white/80 text-center text-sm mb-4">Inscrivez-vous pour commencer à utiliser PayeSmart</p>
        
        {success ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="bg-[var(--ps-orange)]/10 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-[var(--ps-orange)]" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Inscription réussie!</h3>
            <p className="text-white/80 mb-6">
              Un email de vérification a été envoyé à votre adresse email.
              Veuillez vérifier votre boîte de réception.
            </p>
            <button
              onClick={() => {
                // Vérifier si des informations de compte sont disponibles
                const hasNewAccountInfo = localStorage.getItem('newAccountInfo') !== null;
                if (hasNewAccountInfo) {
                  setShowInfoModal(true);
                } else {
                  onSuccess();
                }
              }}
              className="w-full bg-[var(--ps-orange)] hover:bg-[var(--ps-orange)]/90 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              Continuer
            </button>
          </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-1">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-white/80 mb-1">
                Nom de l'entreprise *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="ps-input w-full rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none transition-all"
                  placeholder="Nom de votre entreprise"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-1">
                  Prénom *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="ps-input w-full rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-1">
                  Nom *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="ps-input w-full rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="ps-input w-full rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none transition-all"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1 mt-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="ps-input w-full rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                Mot de passe * <span className="text-sm text-white/60">(min. 6 caractères)</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="ps-input w-full rounded-lg px-4 py-3 text-base focus:outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="ps-input w-full rounded-lg px-4 py-3 text-base focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 bg-[rgba(35,35,35,0.6)] rounded-lg text-white/80 hover:bg-[rgba(35,35,35,0.8)] font-medium transition-all duration-300 hover:shadow-sm text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--ps-orange)] hover:bg-[var(--ps-orange)]/90 text-white px-5 py-3 rounded-lg flex items-center justify-center min-w-[120px] font-medium shadow-md hover:shadow-lg transition-all duration-300 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'S\'inscrire'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
    </>
  );
};

export default ClientRegistration;
