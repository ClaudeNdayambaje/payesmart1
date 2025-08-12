import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Refund } from '../services/refundService';
import { Sale } from '../types';

interface RefundReceiptProps {
  refund: Refund;
  originalSale: Sale;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
  onClose: () => void;
}

const RefundReceipt: React.FC<RefundReceiptProps> = ({ 
  refund, 
  originalSale, 
  businessName, 
  address, 
  phone, 
  email, 
  vatNumber, 
  onClose 
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;

    // Créer un nouvel élément pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres pop-up pour imprimer le ticket');
      return;
    }

    // Récupérer le contenu du reçu
    const receiptContent = receiptRef.current.innerHTML;

    // Ajouter du CSS pour l'impression
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de remboursement - ${businessName}</title>
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
            .refund-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              color: #d32f2f;
              margin: 15px 0;
              text-transform: uppercase;
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
            .negative-amount {
              color: #d32f2f;
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
      printWindow.print();
    };
  };

  // Générer un numéro de ticket de remboursement
  const refundReceiptNumber = `REF-${originalSale.receiptNumber}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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

            <div className="refund-title text-center text-red-600 font-bold text-lg my-4 uppercase">
              Ticket de remboursement
            </div>

            <div className="receipt-info border-t border-b py-4 mb-4">
              <p className="text-center text-sm text-gray-600">
                Remboursement #{refundReceiptNumber}
              </p>
              <p className="text-center text-sm text-gray-600">
                Pour la vente #{originalSale.receiptNumber}
              </p>
              <p className="text-center text-sm text-gray-600">
                Date de remboursement: {
                  (() => {
                    try {
                      // Gestion des différents formats possibles de timestamp
                      if (!refund.timestamp) {
                        return format(new Date(), 'dd/MM/yyyy HH:mm');
                      } else if (typeof refund.timestamp === 'object' && 'toDate' in refund.timestamp && typeof refund.timestamp.toDate === 'function') {
                        // C'est un Timestamp Firestore
                        return format(refund.timestamp.toDate(), 'dd/MM/yyyy HH:mm');
                      } else if (refund.timestamp instanceof Date) {
                        // C'est déjà un objet Date
                        return format(refund.timestamp, 'dd/MM/yyyy HH:mm');
                      } else if (typeof refund.timestamp === 'number') {
                        // C'est un timestamp en millisecondes
                        return format(new Date(refund.timestamp), 'dd/MM/yyyy HH:mm');
                      } else if (typeof refund.timestamp === 'string') {
                        // C'est une chaîne de caractères à parser
                        return format(new Date(refund.timestamp), 'dd/MM/yyyy HH:mm');
                      } else {
                        // Fallback sur la date actuelle
                        console.warn('Format de date inconnu, utilisation de la date actuelle');
                        return format(new Date(), 'dd/MM/yyyy HH:mm');
                      }
                    } catch (error) {
                      console.error('Erreur lors du formatage de la date de remboursement:', error);
                      return format(new Date(), 'dd/MM/yyyy HH:mm'); // Fallback sur la date actuelle
                    }
                  })()
                }
              </p>
            </div>

            <div className="receipt-items space-y-2 mb-6">
              <p className="text-sm font-medium">Articles remboursés:</p>
              {refund.refundedItems.map((item, index) => (
                <div key={`refund-item-${index}`} className="receipt-item flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.product?.name ?? 'Produit inconnu'}</span>
                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    <span className="text-gray-500 ml-2">TVA {item.product?.vatRate ?? 0}%</span>
                  </div>
                  <span className="negative-amount">-{((item.product?.price ?? 0) * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="receipt-total border-t pt-4">
              <div className="total-final flex justify-between font-bold text-lg pt-2">
                <span>Total remboursé</span>
                <span className="negative-amount">-{refund.refundAmount.toFixed(2)} €</span>
              </div>

              <div className="text-center text-sm text-gray-600 mt-4">
                <p>Mode de remboursement: {refund.refundMethod === 'card' ? 'Carte bancaire' : 'Espèces'}</p>
                <p className="mt-2">Type de remboursement: {refund.fullRefund ? 'Total' : 'Partiel'}</p>
              </div>
            </div>

            <div className="receipt-footer mt-8 text-center text-sm text-gray-600">
              <p>Merci de votre compréhension</p>
              <p>À bientôt dans notre magasin!</p>
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

export default RefundReceipt;
