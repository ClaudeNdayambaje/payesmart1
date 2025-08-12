import React, { useState, useEffect } from 'react';
import { X, Info, Copy, Check } from 'lucide-react';

interface NewAccountInfoModalProps {
  onClose: () => void;
}

interface AccountInfo {
  adminName: string;
  businessName: string;
  defaultPin: string;
  email: string;
}

const NewAccountInfoModal: React.FC<NewAccountInfoModalProps> = ({ onClose }) => {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Récupérer les informations du compte depuis le localStorage
    const storedInfo = localStorage.getItem('newAccountInfo');
    if (storedInfo) {
      try {
        const parsedInfo = JSON.parse(storedInfo);
        setAccountInfo(parsedInfo);
        // Supprimer les informations du localStorage après les avoir récupérées
        localStorage.removeItem('newAccountInfo');
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du compte:', error);
      }
    }
  }, []);

  const copyPinToClipboard = () => {
    if (accountInfo) {
      navigator.clipboard.writeText(accountInfo.defaultPin)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Erreur lors de la copie du code PIN:', err));
    }
  };

  if (!accountInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <Info className="h-5 w-5" />
              <h2 className="text-xl font-bold">Informations importantes</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-indigo-800 mb-2">Votre compte a été créé avec succès!</h3>
            <p className="text-indigo-700 text-sm">
              Voici les informations importantes concernant votre nouveau compte. 
              Veuillez les conserver en lieu sûr.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nom de l'entreprise</p>
              <p className="font-medium">{accountInfo.businessName}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Administrateur principal</p>
              <p className="font-medium">{accountInfo.adminName}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium">{accountInfo.email}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Code PIN par défaut</p>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono font-medium text-gray-800">
                  {accountInfo.defaultPin}
                </div>
                <button 
                  onClick={copyPinToClipboard}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Copier le code PIN"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Pour des raisons de sécurité, veuillez changer votre code PIN dès votre première connexion dans les paramètres de votre compte.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAccountInfoModal;
