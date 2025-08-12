import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Receipt, Calculator, Award, ChevronLeft } from 'lucide-react';
import { LoyaltyCard } from '../types';
import { useTheme } from '../contexts/ThemeContext';

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

  // Fonction pour obtenir le style du badge en fonction du niveau de fidélité
  const getTierBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'platinum':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const finalTotal = total * (1 - loyaltyDiscount);

  const handleCashPayment = (amount: number) => {
    if (amount >= finalTotal) {
      setShowChange(true);
      setCashReceived(amount.toString());
    }
  };

  const handleCardPayment = () => {
    onPaymentComplete('card', finalTotal);
  };

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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-lg shadow-md text-white">

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="text-white" size={22} />
              <span className="font-semibold text-lg">{selectedLoyaltyCard.customerName}</span>
            </div>
            <div className={`px-3 py-1 rounded-md ${getTierBadgeStyle(selectedLoyaltyCard.tier)}`}>
              <span className="capitalize font-medium text-sm">
                {selectedLoyaltyCard.tier}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-white border-opacity-20 pt-3 flex justify-between">
            <div>
              <p className="text-xs text-white text-opacity-80">Points actuels</p>
              <p className="font-bold text-xl">{selectedLoyaltyCard.points}</p>
            </div>
            <div>
              <p className="text-xs text-white text-opacity-80">Points à gagner</p>
              <p className="font-bold text-xl">+{Math.floor(finalTotal)}</p>
            </div>
            {loyaltyDiscount > 0 && (
              <div>
                <p className="text-xs text-white text-opacity-80">Réduction</p>
                <p className="font-bold text-xl">{(loyaltyDiscount * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={onShowLoyaltyCard}
          className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 p-3 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-indigo-100 relative z-10"
        >
          <Award size={22} />
          <span className="font-medium">Ajouter une carte de fidélité</span>
        </button>
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

  // Styles dynamiques basés sur les couleurs du thème
  const headerStyle = {
    background: `linear-gradient(to right, ${colors.primary}15, ${colors.secondary}15)`,
    borderColor: `${colors.primary}30`
  };
  
  const iconContainerStyle = {
    backgroundColor: `${colors.primary}20`
  };
  
  const iconStyle = {
    color: colors.primary
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 relative z-50 transition-all duration-300">

        <div className="flex items-center justify-between p-3 border-b transition-all duration-300" style={headerStyle}>

          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md transition-all duration-300" style={iconContainerStyle}>
              <CreditCard style={iconStyle} size={24} />
            </div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 transition-all duration-300">Paiement</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-700 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          {renderLoyaltyInfo()}

          {!paymentMethod ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 mb-3 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 font-medium transition-all duration-300">Total</span>
                  <span className="text-lg font-bold dark:text-white transition-all duration-300">{total.toFixed(2)} €</span>
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
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 transition-all duration-300">
                  <span className="text-gray-800 dark:text-gray-200 font-semibold transition-all duration-300">Total à payer</span>
                  <div style={{backgroundColor: `${colors.primary}15`}} className="px-4 py-2 rounded-md transition-all duration-300">
                    <span style={{color: colors.primary}} className="text-lg font-bold transition-all duration-300">{finalTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-600 font-medium mb-2">Choisissez votre mode de paiement</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 text-amber-700 py-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all duration-300 hover:from-amber-100 hover:to-amber-200 relative z-10"
                >
                  <Banknote size={32} />
                  <span className="font-medium">Espèces</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-700 py-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all duration-300 hover:from-blue-100 hover:to-blue-200 relative z-10"
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
                
                <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 p-3 rounded-lg shadow-sm border border-amber-100 dark:border-amber-800/30 transition-all duration-300">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300">Total à payer</span>
                    <span className="font-bold text-lg dark:text-white transition-all duration-300">{finalTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-amber-100 dark:border-amber-800/30 transition-all duration-300">
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300">Reçu</span>
                    <span className="font-bold text-lg dark:text-white transition-all duration-300">{cashReceived ? `${cashReceived} €` : '-'}</span>
                  </div>
                  {showChange && (
                    <div className="flex justify-between mt-3 py-3 border-t border-amber-100 dark:border-amber-800/30 text-green-600 dark:text-green-400 transition-all duration-300">
                      <span className="font-medium">Monnaie à rendre</span>
                      <span className="font-bold text-xl">{(parseFloat(cashReceived) - finalTotal).toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {!showChange && (
                  <>
                    <p className="text-center text-gray-600 dark:text-gray-300 font-medium mb-2 transition-all duration-300">Montant reçu</p>
                    
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

                    <button
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 py-2 rounded-md hover:shadow-md transition-all duration-300 mt-2"
                    >
                      <Calculator size={20} />
                      <span className="font-medium">Calculatrice</span>
                    </button>

                    {showCalculator && (
                      <div className="bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 p-5 rounded-lg shadow-md mt-4 transition-all duration-300">
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-md mb-4 text-right text-2xl font-mono shadow-inner border border-gray-200 dark:border-gray-700 dark:text-white transition-all duration-300">
                          {calculatorValue || '0'}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '*', 'C', '0', '=', '/'].map(
                            (btn) => {
                              const isOperator = ['+', '-', '*', '/', '='].includes(btn);
                              const isClear = btn === 'C';
                              
                              // Styles dynamiques pour les boutons de la calculatrice
                              let buttonStyle = {};
                              let buttonClass = "py-3 rounded-md font-medium transition-all duration-300 hover:shadow-md ";
                              
                              if (isOperator) {
                                buttonStyle = {
                                  backgroundColor: `${themeColors.primary}15`,
                                  color: themeColors.primary,
                                  borderColor: `${themeColors.primary}30`
                                };
                                buttonClass += "border ";
                              } else if (isClear) {
                                buttonStyle = {
                                  backgroundColor: `${themeColors.error}15`,
                                  color: themeColors.error,
                                  borderColor: `${themeColors.error}30`
                                };
                                buttonClass += "border ";
                              } else {
                                buttonClass += "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 ";
                              }
                              
                              return (
                                <button
                                  key={btn}
                                  style={isOperator || isClear ? buttonStyle : {}}
                                  className={buttonClass}
                                  onClick={() => {
                                    if (btn === 'C') {
                                      setCalculatorValue('');
                                    } else if (btn === '=') {
                                      try {
                                        const result = eval(calculatorValue);
                                        setCalculatorValue(result.toString());
                                        if (result >= finalTotal) {
                                          handleCashPayment(result);
                                          setShowCalculator(false);
                                        }
                                      } catch (e) {
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
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-800/30 shadow-sm transition-all duration-300">
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
                      className="w-full text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 font-medium text-base"
                      style={{ background: `linear-gradient(to right, ${themeColors.success}, ${themeColors.success}CC)` }}
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
                
                <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 p-3 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800/30 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300">Total à payer</span>
                    <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg transition-all duration-300">
                      <span className="font-bold text-lg text-blue-800 dark:text-blue-300 transition-all duration-300">{finalTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-6 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm transition-all duration-300">
                  <div className="animate-pulse mb-6">
                    <div className="relative">
                      <CreditCard size={64} className="mx-auto text-blue-600 dark:text-blue-400 transition-all duration-300" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center transition-all duration-300">
                        <div className="w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full animate-ping transition-all duration-300"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-all duration-300">Terminal de paiement prêt</p>
                  <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto transition-all duration-300">Insérez, appuyez ou présentez votre carte bancaire pour effectuer le paiement</p>
                </div>

                <button
                  onClick={handleCardPayment}
                  className="w-full text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 font-medium text-base"
                  style={{ background: `linear-gradient(to right, ${colors.success}, ${colors.success}CC)` }}
                >
                  <Receipt size={24} />
                  Paiement effectué
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;