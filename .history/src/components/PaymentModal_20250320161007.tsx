import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Receipt, ArrowRight, Calculator, Award } from 'lucide-react';
import { LoyaltyCard } from '../types';

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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showChange, setShowChange] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState(false);

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
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="text-indigo-600" size={20} />
              <span className="font-medium">{selectedLoyaltyCard.customerName}</span>
            </div>
            <span className={`capitalize font-medium ${getTierColor(selectedLoyaltyCard.tier)}`}>
              {selectedLoyaltyCard.tier}
            </span>
          </div>
          <div className="text-sm text-indigo-600">
            <p>Points actuels: {selectedLoyaltyCard.points}</p>
            <p>Points à gagner: {Math.floor(finalTotal)}</p>
            {loyaltyDiscount > 0 && (
              <p className="font-medium">Réduction fidélité: {(loyaltyDiscount * 100).toFixed(0)}%</p>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={onShowLoyaltyCard}
          className="w-full bg-indigo-50 text-indigo-600 p-4 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2"
        >
          <Award size={20} />
          Ajouter une carte de fidélité
        </button>
      )}
    </div>
  );

  const getTierColor = (tier: LoyaltyCard['tier']) => {
    switch (tier) {
      case 'bronze':
        return 'text-amber-700';
      case 'silver':
        return 'text-gray-500';
      case 'gold':
        return 'text-yellow-500';
      case 'platinum':
        return 'text-blue-500';
      default:
        return 'text-gray-700';
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Paiement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {renderLoyaltyInfo()}

          {!paymentMethod ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold">{total.toFixed(2)} €</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between items-center mt-2 text-green-600">
                    <span>Réduction fidélité</span>
                    <span>-{(total * loyaltyDiscount).toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2 font-bold">
                  <span>Total à payer</span>
                  <span className="text-2xl">{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <button
                onClick={() => setPaymentMethod('cash')}
                className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-lg flex items-center justify-between px-6 hover:bg-indigo-50"
              >
                <div className="flex items-center gap-3">
                  <Banknote size={24} />
                  <span className="font-medium">Espèces</span>
                </div>
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-lg flex items-center justify-between px-6 hover:bg-indigo-50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={24} />
                  <span className="font-medium">Carte bancaire</span>
                </div>
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            paymentMethod === 'cash' ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Total à payer</span>
                    <span className="font-bold">{finalTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reçu</span>
                    <span className="font-bold">{cashReceived ? `${cashReceived} €` : '-'}</span>
                  </div>
                  {showChange && (
                    <div className="flex justify-between mt-2 text-green-600 font-bold">
                      <span>Monnaie à rendre</span>
                      <span>{(parseFloat(cashReceived) - finalTotal).toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {!showChange && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {[5, 10, 20, 50].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleCashPayment(amount)}
                          className="bg-white border-2 border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-50"
                        >
                          {amount.toFixed(2)} €
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Montant reçu"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleCashPayment(parseFloat(cashReceived))}
                        disabled={!cashReceived || parseFloat(cashReceived) < finalTotal}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
                      >
                        Valider
                      </button>
                    </div>

                    <button
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                    >
                      <Calculator size={20} />
                      Calculatrice
                    </button>

                    {showCalculator && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="bg-white p-2 rounded mb-4 text-right text-2xl">
                          {calculatorValue || '0'}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '*', 'C', '0', '=', '/'].map(
                            (btn) => (
                              <button
                                key={btn}
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
                                className="bg-white p-3 rounded shadow hover:bg-gray-50"
                              >
                                {btn}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showChange && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">Détail de la monnaie à rendre</h3>
                      <div className="space-y-1">
                        {getChangeBreakdown(change).map(({ denomination, count }) => (
                          <div key={denomination} className="flex justify-between text-sm">
                            <span>{denomination < 1 ? `${(denomination * 100).toFixed(0)} centimes` : `${denomination} euros`}</span>
                            <span>x {count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => onPaymentComplete('cash', parseFloat(cashReceived))}
                      className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Receipt size={20} />
                      Terminer et imprimer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total à payer</span>
                    <span className="font-bold">{finalTotal.toFixed(2)} €</span>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  <div className="animate-pulse mb-4">
                    <CreditCard size={48} className="mx-auto text-indigo-600" />
                  </div>
                  <p className="text-lg font-medium mb-2">Terminal de paiement prêt</p>
                  <p className="text-gray-600">Insérez, appuyez ou présentez la carte</p>
                </div>

                <button
                  onClick={handleCardPayment}
                  className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Receipt size={20} />
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