import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Receipt, Calculator, Award, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { LoyaltyCard } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import vivaPaymentsService from '../services/vivaPaymentsService';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentComplete: (method: 'cash' | 'card', amountReceived: number) => void;
  onShowLoyaltyCard: () => void;
  selectedLoyaltyCard?: LoyaltyCard;
  loyaltyDiscount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  total,
  onClose,
  onPaymentComplete,
  onShowLoyaltyCard,
  selectedLoyaltyCard,
  loyaltyDiscount,
}) => {
  // Utiliser le contexte de thème pour accéder aux couleurs
  const { colors } = useTheme();
  
  // Couleurs par défaut au cas où le contexte de thème n'est pas encore initialisé
  const defaultColors = {
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  // Utiliser les couleurs du thème ou les couleurs par défaut si non disponibles
  const themeColors = colors || defaultColors;
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showChange, setShowChange] = useState(false);
  const [showChangeDetails, setShowChangeDetails] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState(false);
  
  // États pour le paiement Viva
  const [vivaPaymentStatus, setVivaPaymentStatus] = useState<'terminal_ready' | 'processing' | 'success' | 'error'>('terminal_ready');
  const [vivaPaymentError, setVivaPaymentError] = useState<string | null>(null);

  // Fonction pour obtenir le style du badge en fonction du niveau de fidélité
  const getTierBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'platinum':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Fonction pour obtenir la couleur en fonction du niveau de fidélité
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-amber-600';
      case 'silver':
        return 'bg-gray-500';
      case 'gold':
        return 'bg-yellow-500';
      case 'platinum':
        return 'bg-indigo-600';
      default:
        return 'bg-gray-500';
    }
  };

  const finalTotal = total * (1 - loyaltyDiscount);

  const handleCashPayment = (amount: number) => {
    if (amount >= finalTotal) {
      setShowChange(true);
      setCashReceived(amount.toString());
    }
  };

  const confirmVivaPayment = async () => {
    try {
      setVivaPaymentStatus('processing');
      setVivaPaymentError(null);
      
      // Créer une référence de transaction unique
      const merchantTrns = `transaction-${Date.now()}`;
      
      // Calculer le montant en centimes (format requis par Viva)
      const amountInCents = Math.round(finalTotal * 100);
      
      // Effectuer la transaction
      const paymentResult = await vivaPaymentsService.createSaleTransaction(amountInCents, merchantTrns);
      
      console.log('Résultat du paiement Viva:', paymentResult);
      setVivaPaymentStatus('success');
      
      // Attendre 1.5 secondes pour que l'utilisateur puisse voir le message de succès
      setTimeout(() => {
        // Finaliser la vente
        onPaymentComplete('card', finalTotal);
      }, 1500);
      
    } catch (error) {
      console.error('Erreur de paiement Viva:', error);
      setVivaPaymentStatus('error');
      setVivaPaymentError(error instanceof Error ? error.message : 'Erreur de paiement inconnue');
    }
  };

  // Déclencher automatiquement le processus de paiement lors du changement de mode de paiement
  useEffect(() => {
    if (paymentMethod === 'card' && vivaPaymentStatus === 'terminal_ready') {
      // Démarrer automatiquement le processus de paiement Viva
      confirmVivaPayment();
    }
  }, [paymentMethod]);

  const change = cashReceived ? parseFloat(cashReceived) - finalTotal : 0;

  const denominations = [
    500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01
  ];

  const getChangeBreakdown = (changeAmount: number) => {
    const breakdown: { denomination: number; count: number }[] = [];
    let remaining = changeAmount;

    denominations.forEach(denomination => {
      if (remaining >= denomination) {
        const count = Math.floor(remaining / denomination);
        breakdown.push({ denomination, count });
        remaining = Number((remaining % denomination).toFixed(2));
      }
    });

    return breakdown;
  };

  const renderLoyaltyInfo = () => (
    <div className="mb-4">
      {selectedLoyaltyCard ? (
        <div className={`${getTierColor(selectedLoyaltyCard.tier)} p-4 rounded-lg shadow-md text-white relative overflow-hidden`}>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-white bg-opacity-20 p-1.5 rounded-full">
                  <Award className="text-white" size={20} />
                </div>
                <span className="font-semibold text-lg">{selectedLoyaltyCard.customerName}</span>
              </div>
              <div className={`px-3 py-1 rounded-full ${getTierBadgeStyle(selectedLoyaltyCard.tier)}`}>
                <span className="capitalize font-medium text-sm">
                  {selectedLoyaltyCard.tier}
                </span>
              </div>
            </div>
            
            <div className="mt-4 border-t border-white border-opacity-20 pt-3 grid grid-cols-3 gap-3">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-3 py-2">
                <p className="text-xs text-white text-opacity-80">Points actuels</p>
                <p className="font-bold text-xl">{selectedLoyaltyCard.points}</p>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-3 py-2">
                <p className="text-xs text-white text-opacity-80">Points à gagner</p>
                <p className="font-bold text-xl">+{Math.floor(finalTotal)}</p>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="text-center bg-white bg-opacity-10 rounded-lg px-3 py-2">
                  <p className="text-xs text-white text-opacity-80">Réduction</p>
                  <p className="font-bold text-xl">{(loyaltyDiscount * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-xs text-white text-opacity-70 text-right">
              Carte n° {selectedLoyaltyCard.number}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award 
                size={22} 
                style={{ color: colors.primary }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-200">Carte de fidélité (optionnel)</span>
            </div>
          </div>
          {/* Masquer la description de la carte de fidélité */}
          {/*<p className="text-sm text-gray-600 mb-4">Vous pouvez ajouter une carte de fidélité pour accumuler des points et bénéficier de réductions, ou continuer sans carte.</p>*/}
          <div className="flex justify-start">
            <button
              onClick={onShowLoyaltyCard}
              className="text-white px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Award size={18} />
              <span className="font-medium">Ajouter une carte</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );



  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && showChange) {
        onPaymentComplete('cash', parseFloat(cashReceived));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, showChange, cashReceived, onPaymentComplete, selectedLoyaltyCard]);

  // Style dynamique pour les boutons basé sur les couleurs du thème
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] p-6 text-left align-middle relative z-50 transition-all duration-300">

        <div className="flex items-center justify-between mb-4 transition-all duration-300">
          <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Paiement</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-700 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          {/* Masquer les informations de fidélité lorsque la calculatrice est ouverte */}
          {!showCalculator && renderLoyaltyInfo()}

          {!paymentMethod ? (
            <div className="space-y-4">
              <div className="mt-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 transition-all duration-300 mb-3">Récapitulatif</h3>
                <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 transition-all duration-300">
                  <span>Montant des articles</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between items-center mt-3 text-green-600 dark:text-green-400 transition-all duration-300">
                    <span className="flex items-center gap-1">
                      <Award size={16} />
                      <span>Réduction fidélité</span>
                    </span>
                    <span className="font-medium">-{(total * loyaltyDiscount).toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 transition-all duration-300">
                  <span className="text-gray-800 dark:text-gray-200 font-semibold text-lg transition-all duration-300">Net à payer</span>
                  <span className="text-xl font-bold transition-all duration-300 dark:text-[#f6941c]" style={{ color: colors.primary }}>{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <p className="text-center text-gray-600 font-medium mb-2">Choisissez votre mode de paiement</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setPaymentMethod('cash');
                    // Ne pas déclencher directement le paiement, laisser l'utilisateur confirmer
                  }}
                  className="py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 relative z-10 border hover:opacity-90"
                  style={{
                    backgroundColor: `${colors.success}15`,
                    borderColor: `${colors.success}30`,
                    color: colors.success
                  }}
                >
                  <Banknote size={32} />
                  <span className="font-medium">Espèces</span>
                </button>

                <button
                  onClick={() => {
                    setPaymentMethod('card');
                    // Déclencher automatiquement le processus de paiement Viva
                    // La fonction confirmVivaPayment sera appelée automatiquement via useEffect
                  }}
                  className="py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 relative z-10 border hover:opacity-90"
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    borderColor: `${colors.primary}30`,
                    color: colors.primary
                  }}
                >
                  <CreditCard size={32} />
                  <span className="font-medium">Carte bancaire</span>
                </button>
              </div>
            </div>
          ) : (
            paymentMethod === 'cash' ? (
              <div className="space-y-6">
                {paymentMethod && (
                  <button 
                    onClick={() => setPaymentMethod(null)} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-2 transition-all duration-300"
                  >
                    <ChevronLeft size={20} />
                    <span>Retour aux modes de paiement</span>
                  </button>
                )}
                
                <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-lg transition-all duration-300">Net à payer</span>
                    <span className="font-bold text-xl transition-all duration-300" style={{ color: colors.primary }}>{finalTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-gray-200 dark:border-gray-700 transition-all duration-300">
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300">Reçu</span>
                    <span className="font-bold text-lg dark:text-white transition-all duration-300">{cashReceived ? `${cashReceived} €` : '-'}</span>
                  </div>
                  {showChange && (
                    <div className="flex justify-between mt-3 py-3 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400 transition-all duration-300">
                      <span className="font-medium">Monnaie à rendre</span>
                      <span className="font-bold text-xl">{(parseFloat(cashReceived) - finalTotal).toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {!showChange && (
                  <>
                    {/* Afficher le texte "Montant reçu" uniquement si la calculatrice n'est pas ouverte */}
                    {!showCalculator && (
                      <p className="text-center text-gray-600 dark:text-gray-300 font-medium mb-2 transition-all duration-300">Montant reçu</p>
                    )}
                    
                    {/* Masquer les boutons de montant prédéfinis lorsque la calculatrice est ouverte */}
                    {!showCalculator && (
                      <div className="grid grid-cols-4 gap-3">
                        {[5, 10, 20, 50, 100, 200, 500, 1000].map((amount) => {
                          // Styles dynamiques pour les boutons de montant
                          let borderColor, textColor;
                          if (amount <= 20) {
                            borderColor = `${themeColors.accent}40`;
                            textColor = themeColors.accent;
                          } else if (amount <= 100) {
                            borderColor = `${themeColors.primary}40`;
                            textColor = themeColors.primary;
                          } else {
                            borderColor = `${themeColors.secondary}40`;
                            textColor = themeColors.secondary;
                          }
                          
                          return (
                            <button
                              key={amount}
                              onClick={() => handleCashPayment(amount)}
                              className="bg-white dark:bg-gray-700 border py-4 px-1 rounded-md hover:shadow-md transition-all duration-300 font-medium"
                              style={{ borderColor, color: textColor }}
                            >
                              {amount < 100 ? `${amount} €` : `${amount/100} €`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Réorganiser l'affichage du champ de saisie et du bouton de validation */}
                    <div className="flex gap-2 mt-4">
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Montant reçu"
                        className={`flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${themeColors.primary.replace('#', '')} text-base transition-all duration-300`}
                      />
                      <button
                        onClick={() => handleCashPayment(parseFloat(cashReceived))}
                        disabled={!cashReceived || parseFloat(cashReceived) < finalTotal}
                        className="text-white px-4 py-2 rounded-md font-medium hover:shadow-md transition-all duration-300 disabled:opacity-50"
                        style={{
                          background: !cashReceived || parseFloat(cashReceived) < finalTotal 
                            ? 'linear-gradient(to right, #9ca3af, #6b7280)' 
                            : `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`
                        }}
                      >
                        Valider
                      </button>
                    </div>

                    {/* Bouton pour afficher/masquer la calculatrice */}
                    <button
                      onClick={() => {
                        setShowCalculator(!showCalculator);
                        // Réinitialiser la valeur de la calculatrice lors de la fermeture
                        if (showCalculator) {
                          setCalculatorValue('');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:opacity-90 transition-all duration-300 mt-3 shadow-md text-white font-medium"
                      style={{
                        backgroundColor: colors.primary
                      }}
                    >
                      <Calculator size={20} />
                      <span className="font-medium">{showCalculator ? 'Masquer calculatrice' : 'Calculatrice'}</span>
                    </button>

                    {showCalculator && (
                      <div className="bg-primary p-4 rounded-lg shadow-md mt-4 transition-all duration-300 dark:bg-primary-dark">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md mb-4 text-right text-2xl font-mono shadow-inner border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-all duration-300">
                          {calculatorValue || '0'}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '*', 'C', '0', '=', '/'].map(
                            (btn) => {
                              const isOperator = ['+', '-', '*', '/'].includes(btn);
                              const isClear = btn === 'C';
                              const isEquals = btn === '=';
                              
                              // Styles dynamiques pour les boutons de la calculatrice en respectant le thème
                              let buttonClass = "py-3 rounded-md font-medium transition-all duration-300 hover:shadow-md ";
                              
                              if (isOperator) {
                                buttonClass += "bg-primary-light hover:bg-primary text-white dark:bg-primary-dark dark:hover:bg-primary border border-primary dark:border-primary-dark font-bold ";
                              } else if (isClear) {
                                buttonClass += "bg-red-400 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-700 text-white border border-red-500 dark:border-red-700 ";
                              } else if (isEquals) {
                                buttonClass += "bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-700 text-white border border-green-500 dark:border-green-700 font-bold ";
                              } else {
                                buttonClass += "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white ";
                              }
                              
                              return (
                                <button
                                  key={btn}
                                  className={buttonClass}
                                  onClick={() => {
                                    if (btn === 'C') {
                                      setCalculatorValue('');
                                    } else if (btn === '=') {
                                      try {
                                        // Utiliser Function à la place de eval pour plus de sécurité
                                        // Limiter aux opérations mathématiques de base
                                        const sanitizedExpression = calculatorValue.replace(/[^0-9+\-*/().]/g, '');
                                        const result = Function('return ' + sanitizedExpression)();
                                        
                                        // Vérifier que le résultat est un nombre valide
                                        if (isNaN(result) || !isFinite(result)) {
                                          throw new Error('Calcul invalide');
                                        }
                                        
                                        setCalculatorValue(result.toString());
                                        if (result >= finalTotal) {
                                          handleCashPayment(result);
                                          setShowCalculator(false);
                                        }
                                      } catch {
                                        setCalculatorValue('Erreur');
                                      }
                                    } else {
                                      setCalculatorValue(prev => prev + btn);
                                    }
                                  }}
                                >
                                  {btn}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showChange && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-gray-800 p-3 rounded-lg border-[0.5px] border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full transition-all duration-300">
                            <Receipt className="text-green-700 dark:text-green-400" size={16} />
                          </div>
                          <h3 className="font-bold text-green-800 dark:text-green-300 text-sm transition-all duration-300">Monnaie à rendre: <span className="text-green-600 dark:text-green-400">{change.toFixed(2)} €</span></h3>
                        </div>
                        <button 
                          onClick={() => setShowChangeDetails(!showChangeDetails)} 
                          className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs font-medium px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-md hover:bg-green-200 dark:hover:bg-green-800/40 transition-all duration-300"
                        >
                          {showChangeDetails ? 'Masquer détails' : 'Voir détails'}
                        </button>
                      </div>
                      
                      {showChangeDetails && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {getChangeBreakdown(change).map(({ denomination, count }) => (
                            <div key={denomination} className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded-md border border-green-100 dark:border-green-800/30 text-xs transition-all duration-300">
                              <span className="text-gray-700 dark:text-gray-300 ml-2">{denomination < 1 ? `${(denomination * 100).toFixed(0)}c` : `${denomination}€`}</span>
                              <span className="font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md transition-all duration-300">×{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onPaymentComplete('cash', parseFloat(cashReceived))}
                      className="w-full text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-all duration-300 font-medium text-base"
                      style={{
                        backgroundColor: colors.primary
                      }}
                    >
                      <Receipt size={24} />
                      Terminer et imprimer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {paymentMethod && (
                  <button 
                    onClick={() => setPaymentMethod(null)} 
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-2 transition-all duration-300"
                  >
                    <ChevronLeft size={20} />
                    <span>Retour aux modes de paiement</span>
                  </button>
                )}
                
                <div className="bg-gradient-to-b theme-primary-gradient p-3 rounded-lg shadow-sm border-[0.5px] border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-lg transition-all duration-300">Net à payer</span>
                    <span className="font-bold text-xl transition-all duration-300" style={{ color: colors.primary }}>{finalTotal.toFixed(2)} €</span>
                  </div>
                </div>
                
                {/* Affichage en fonction du statut du paiement Viva */}
                {vivaPaymentStatus === 'terminal_ready' && (
                  <div className="text-center py-6 bg-gradient-to-b theme-primary-gradient rounded-lg border-[0.5px] border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
                    <div className="mb-6">
                      <div className="relative">
                        <CreditCard size={64} className="mx-auto theme-primary-text transition-all duration-300" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-all duration-300">Terminal de paiement prêt</p>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto transition-all duration-300">Présentez la carte bancaire au terminal pour effectuer le paiement</p>
                  </div>
                )}
                
                {vivaPaymentStatus === 'processing' && (
                  <div className="text-center py-6 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-gray-800 rounded-lg border-[0.5px] border-blue-200 dark:border-blue-800/50 shadow-sm transition-all duration-300">
                    <div className="animate-pulse mb-6">
                      <div className="relative">
                        <CreditCard size={64} className="mx-auto text-blue-600 dark:text-blue-400 transition-all duration-300" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center transition-all duration-300">
                          <div className="w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full animate-ping transition-all duration-300"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-all duration-300">Traitement en cours...</p>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto transition-all duration-300">Veuillez patienter pendant le traitement du paiement</p>
                  </div>
                )}
                
                {vivaPaymentStatus === 'success' && (
                  <div className="text-center py-6 bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900/20 dark:to-gray-800 rounded-lg border-[0.5px] border-green-200 dark:border-green-800/50 shadow-sm transition-all duration-300">
                    <div className="mb-6">
                      <div className="relative">
                        <CheckCircle size={64} className="mx-auto text-green-600 dark:text-green-400 transition-all duration-300" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-all duration-300">Paiement réussi !</p>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto transition-all duration-300">Votre transaction a été traitée avec succès</p>
                  </div>
                )}
                
                {vivaPaymentStatus === 'error' && (
                  <div className="text-center py-6 bg-gradient-to-b from-red-50 to-red-100 dark:from-red-900/20 dark:to-gray-800 rounded-lg border-[0.5px] border-red-200 dark:border-red-800/50 shadow-sm transition-all duration-300">
                    <div className="mb-6">
                      <div className="relative">
                        <AlertCircle size={64} className="mx-auto text-red-600 dark:text-red-400 transition-all duration-300" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-all duration-300">Erreur de paiement</p>
                    <p className="text-red-600 dark:text-red-400 max-w-xs mx-auto transition-all duration-300">{vivaPaymentError || 'Une erreur est survenue lors du traitement du paiement'}</p>
                  </div>
                )}

                {/* Bouton supprimé car le processus est maintenant automatique */}
                
                {vivaPaymentStatus === 'error' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setVivaPaymentStatus('terminal_ready')}
                      className="flex-1 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-all duration-300 font-medium text-base"
                      style={{
                        backgroundColor: colors.primary
                      }}
                    >
                      <CreditCard size={24} />
                      Réessayer
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="flex-1 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-all duration-300 font-medium text-base"
                      style={{
                        backgroundColor: colors.error
                      }}
                    >
                      <X size={24} />
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;