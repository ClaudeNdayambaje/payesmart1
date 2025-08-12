import React, { useState } from 'react';
import { Sale, CartItem } from '../types';
import { CreditCard, FileText, RefreshCcw, Receipt, MinusCircle, Trash2 } from 'lucide-react';
import RefundModal from './RefundModal';
import { format } from 'date-fns';

// Fonction utilitaire pour formater les montants en euros
const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === undefined) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

interface SalesHistoryProps {
  sales: Sale[];
  onViewReceipt: (sale: Sale) => void;
  onViewRefundReceipt?: (sale: Sale) => void; // Fonction pour afficher les tickets de remboursement
  onRefundSale?: (saleId: string, refundItems: CartItem[], refundMethod: 'cash' | 'card', fullRefund: boolean) => Promise<void>;
  onDeleteSale?: (saleId: string) => Promise<boolean>; // Nouvelle fonction pour supprimer une vente
  getEmployeeName?: (employeeId: string) => string;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onViewReceipt, onViewRefundReceipt, onRefundSale, onDeleteSale, getEmployeeName }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  
  // Fonction pour gérer la demande de suppression
  const handleDeleteRequest = (saleId: string) => {
    setSaleToDelete(saleId);
    setIsDeleteConfirmOpen(true);
  };
  
  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (saleToDelete && onDeleteSale) {
      try {
        const success = await onDeleteSale(saleToDelete);
        if (success) {
          // La suppression a réussi, fermer le modal
          setIsDeleteConfirmOpen(false);
          setSaleToDelete(null);
        } else {
          // La suppression a échoué, afficher un message d'erreur
          alert('Erreur lors de la suppression de la vente. Veuillez réessayer.');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de la vente:', error);
        alert('Une erreur est survenue lors de la suppression de la vente.');
      }
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Articles
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Paiement
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Terminal
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sales.map((sale) => {
                // Détermine si c'est une vente remboursée (partiellement ou totalement)
                const isRefunded = sale.refunded === true;
                
                // Appliquer une classe CSS différente pour les remboursements
                const rowClass = isRefunded 
                  ? "hover:bg-red-50 dark:hover:bg-red-900/20 bg-red-50/30 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 transition-colors duration-150" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors duration-150";
                
                // Formatter le montant avec un signe négatif pour les remboursements
                let formattedAmount = '';
                try {
                  if (isRefunded && sale.refundAmount !== undefined && sale.refundAmount !== null) {
                    // S'assurer que c'est bien un nombre
                    const refundAmount = typeof sale.refundAmount === 'number' 
                      ? sale.refundAmount 
                      : parseFloat(String(sale.refundAmount));
                    
                    if (!isNaN(refundAmount)) {
                      formattedAmount = formatCurrency(-refundAmount); // Montant négatif pour les remboursements
                    } else {
                      formattedAmount = formatCurrency(sale.total || 0);
                    }
                  } else {
                    formattedAmount = formatCurrency(sale.total || 0);
                  }
                } catch (error) {
                  console.warn("Erreur de formatage du montant pour la vente", sale.id, error);
                  formattedAmount = formatCurrency(0);
                }
                
                // Format de la date avec heure pour les remboursements
                let dateToShow = '';
                try {
                  if (isRefunded && sale.refundTimestamp) {
                    // Gestion des différents formats possibles de date Firebase
                    if (typeof sale.refundTimestamp === 'object' && sale.refundTimestamp.toDate) {
                      // C'est un objet Timestamp Firestore
                      dateToShow = format(sale.refundTimestamp.toDate(), 'dd/MM/yyyy HH:mm');
                    } else if (sale.refundTimestamp instanceof Date) {
                      // C'est déjà un objet Date
                      dateToShow = format(sale.refundTimestamp, 'dd/MM/yyyy HH:mm');
                    } else {
                      // Essayer de convertir une string ou un timestamp en Date
                      dateToShow = format(new Date(sale.refundTimestamp), 'dd/MM/yyyy HH:mm');
                    }
                  } else {
                    // Pour les ventes normales
                    dateToShow = format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm');
                  }
                } catch (error) {
                  // En cas d'erreur, utiliser la date de vente originale
                  console.warn("Erreur de formatage de date pour la vente", sale.id, error);
                  dateToShow = format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm');
                }
                
                // Texte à afficher pour la méthode de paiement
                const paymentMethodText = isRefunded
                  ? sale.refundMethod === 'cash' ? 'Remboursé en espèces' : 'Remboursé sur carte'
                  : sale.paymentMethod === 'cash' ? 'Espèces' : 'Carte';
                
                // Classe CSS pour la méthode de paiement
                const paymentMethodClass = isRefunded
                  ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/30"
                  : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-800/30";
                
                // Icône pour la méthode de paiement
                const PaymentIcon = isRefunded ? MinusCircle : CreditCard;
                
                return (
                  <tr key={sale.id} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{dateToShow}</div>
                      {isRefunded && (
                        <div className="mt-1 text-xs font-medium text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded inline-flex items-center">
                          REMBOURSEMENT
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Client anonyme</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                        {isRefunded && sale.refundedItems && Array.isArray(sale.refundedItems)
                          ? sale.refundedItems.length === 1 
                            ? '1 article remboursé' 
                            : `${sale.refundedItems.length} articles remboursés`
                          : sale.items && Array.isArray(sale.items) && sale.items.length === 1 
                            ? '1 article' 
                            : sale.items && Array.isArray(sale.items) ? `${sale.items.length} articles` : 'Articles inconnus'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={paymentMethodClass}>
                          <PaymentIcon className="w-3 h-3 mr-1" /> {paymentMethodText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.paymentMethod === 'card' ? (
                        sale.paymentTerminalName ? (
                          <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            {sale.paymentTerminalName}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${isRefunded ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {formattedAmount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {getEmployeeName ? getEmployeeName(sale.employeeId) : "Employé inconnu"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {/* Bouton pour voir le ticket de vente original */}
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-600/80 rounded-md transition-colors duration-200"
                        title="Voir le ticket de vente"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      
                      {/* Bouton pour voir le ticket de remboursement si c'est un remboursement */}
                      {isRefunded && onViewRefundReceipt && (
                        <button
                          onClick={() => onViewRefundReceipt(sale)} 
                          className="inline-flex items-center justify-center p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600/80 rounded-md transition-colors duration-200"
                          title="Voir le ticket de remboursement"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Bouton pour effectuer un remboursement si applicable */}
                      {onRefundSale && !isRefunded && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsRefundModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-1.5 text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:text-white dark:hover:bg-amber-600/80 rounded-md transition-colors duration-200"
                          title="Rembourser"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Bouton pour supprimer une vente */}
                      {onDeleteSale && (
                        <button
                          onClick={() => handleDeleteRequest(sale.id)}
                          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-white bg-gray-50 hover:bg-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                          title="Supprimer la vente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {sales.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400 dark:text-gray-500" />
            <p className="text-lg font-medium">Aucune vente trouvée</p>
            <p className="text-sm">Aucune vente n'est disponible pour le moment</p>
          </div>
        )}
      </div>

      {isRefundModalOpen && selectedSale && onRefundSale && (
        <RefundModal 
          isOpen={isRefundModalOpen}
          sale={selectedSale}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedSale(null);
          }}
          onRefund={async (saleId: string, refundItems: CartItem[], refundMethod: 'cash' | 'card', fullRefund: boolean) => {
            try {
              await onRefundSale(saleId, refundItems, refundMethod, fullRefund);
              setIsRefundModalOpen(false);
              setSelectedSale(null);
            } catch (error) {
              console.error("Erreur lors du remboursement:", error);
              alert("Une erreur est survenue lors du remboursement.");
            }
          }}
        />
      )}
      
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmation de suppression</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200"
              >
                Annuler
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
