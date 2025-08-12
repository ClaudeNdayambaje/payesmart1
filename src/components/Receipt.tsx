import React, { useRef, useState } from 'react';
import { Receipt as ReceiptType } from '../types';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';

interface ReceiptProps {
  receipt: ReceiptType;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ receipt, onClose }) => {
  const { sale, businessName, address, phone, email, vatNumber } = receipt;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    setIsPrinting(true);

    // Créer un nouvel élément pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres pop-up pour imprimer le ticket');
      setIsPrinting(false);
      return;
    }

    // Récupérer le contenu du reçu
    const receiptContent = receiptRef.current.innerHTML;

    // Ajouter du CSS pour l'impression
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de caisse - ${businessName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .receipt-header h2 {
              font-size: 18px;
              margin-bottom: 5px;
            }
            .receipt-header p {
              font-size: 12px;
              margin: 2px 0;
              color: #666;
            }
            .receipt-info {
              border-top: 1px solid #ddd;
              border-bottom: 1px solid #ddd;
              padding: 10px 0;
              margin-bottom: 15px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .receipt-items {
              margin-bottom: 20px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .receipt-total {
              border-top: 1px solid #ddd;
              padding-top: 10px;
              margin-top: 10px;
            }
            .receipt-total .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .receipt-total .total-final {
              font-weight: bold;
              font-size: 14px;
              margin-top: 5px;
              border-top: 1px solid #ddd;
              padding-top: 5px;
            }
            .receipt-footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
            @media print {
              body {
                width: 80mm;
                font-size: 12px;
              }
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `);

    // Fermer le document pour finaliser l'écriture
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      // Imprimer le ticket
      printWindow.print();
      
      // Écouter l'événement afterprint pour savoir quand l'impression est terminée
      printWindow.addEventListener('afterprint', () => {
        setIsPrinting(false);
      });
      
      // Mettre à jour l'état si la fenêtre est fermée sans impression
      printWindow.addEventListener('unload', () => {
        setIsPrinting(false);
      });
      
      // Sécurité : si les événements ne se déclenchent pas, on désactive l'état de chargement après 10 secondes
      setTimeout(() => {
        setIsPrinting(false);
      }, 10000);
    };
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {isPrinting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <LoadingSpinner type="pulse" size="lg" label="Préparation de l'impression..." />
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 theme-aware-component">
        <div className="p-6">
          <div ref={receiptRef}>
            <div className="receipt-header text-center mb-6">
              <h2 className="text-xl font-bold">{businessName}</h2>
              <p className="text-gray-600 text-sm">{address}</p>
              <p className="text-gray-600 text-sm">{phone}</p>
              <p className="text-gray-600 text-sm">{email}</p>
              <p className="text-gray-600 text-sm">TVA: {vatNumber}</p>
            </div>

            <div className="receipt-info border-t border-b py-4 mb-4">
              <p className="text-center text-sm text-gray-600">
                Ticket #{sale.receiptNumber}
              </p>
              <p className="text-center text-sm text-gray-600">
                {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>

            <div className="receipt-items space-y-2 mb-6">
              {sale.items.map((item, index) => (
                // Utiliser l'index comme clé de secours si item.product ou item.product.id est manquant
                <div key={item.product?.id ?? `item-${index}`} className="receipt-item flex justify-between text-sm">
                  <div>
                    {/* Vérifier si item.product et item.product.name existent */}
                    <span className="font-medium">{item.product?.name ?? 'Produit inconnu'}</span>
                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    {/* Vérifier si item.product et item.product.vatRate existent */}
                    <span className="text-gray-500 ml-2">TVA {item.product?.vatRate ?? 0}%</span>
                  </div>
                  {/* Vérifier si item.product et item.product.price existent */}
                  <span>{((item.product?.price ?? 0) * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="receipt-total border-t pt-4 space-y-2">
              <div className="total-row flex justify-between text-sm">
                <span>Sous-total</span>
                <span>{sale.subtotal.toFixed(2)} €</span>
              </div>
              
              {/* Vérifier si sale.vatAmounts existe avant d'accéder à vat6 */}
              {(sale.vatAmounts?.vat6 ?? 0) > 0 && (
                <div className="total-row flex justify-between text-sm">
                  <span>TVA 6%</span>
                  {/* Utiliser 0 comme valeur par défaut si vat6 n'existe pas */}
                  <span>{(sale.vatAmounts?.vat6 ?? 0).toFixed(2)} €</span>
                </div>
              )}
              {/* Vérifier si sale.vatAmounts existe avant d'accéder à vat12 */}
              {(sale.vatAmounts?.vat12 ?? 0) > 0 && (
                <div className="total-row flex justify-between text-sm">
                  <span>TVA 12%</span>
                  {/* Utiliser 0 comme valeur par défaut si vat12 n'existe pas */}
                  <span>{(sale.vatAmounts?.vat12 ?? 0).toFixed(2)} €</span>
                </div>
              )}
              {/* Vérifier si sale.vatAmounts existe avant d'accéder à vat21 */}
              {(sale.vatAmounts?.vat21 ?? 0) > 0 && (
                <div className="total-row flex justify-between text-sm">
                  <span>TVA 21%</span>
                  {/* Utiliser 0 comme valeur par défaut si vat21 n'existe pas */}
                  <span>{(sale.vatAmounts?.vat21 ?? 0).toFixed(2)} €</span>
                </div>
              )}
              
              <div className="total-final flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{sale.total.toFixed(2)} €</span>
              </div>

              {sale.paymentMethod === 'cash' && (
                <>
                  <div className="total-row flex justify-between text-sm pt-2">
                    <span>Montant reçu</span>
                    <span>{sale.amountReceived.toFixed(2)} €</span>
                  </div>
                  <div className="total-row flex justify-between text-sm">
                    <span>Monnaie rendue</span>
                    <span>{sale.change.toFixed(2)} €</span>
                  </div>
                </>
              )}
              
              <div className="text-center text-sm text-gray-600 mt-4">
                <p>Mode de paiement: {sale.paymentMethod === 'card' ? 'Carte bancaire' : 'Espèces'}</p>
              </div>
            </div>

            <div className="receipt-footer mt-8 text-center text-sm text-gray-600">
              <p>Merci de votre visite!</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-success)',
                color: 'white'
              }}
            >
              <Printer size={18} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 text-white py-2 rounded-lg transition-colors hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-error)',
                color: 'white'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;