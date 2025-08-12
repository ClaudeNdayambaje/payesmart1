import React, { useState } from 'react';
import { Client, Subscription, Payment } from '../../types/saas';
import { addPayment, updatePayment, markPaymentAsCompleted, refundPayment } from '../../services/paymentService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Plus, Check, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PaymentsManagerProps {
  payments: Payment[];
  clients: Client[];
  subscriptions: Subscription[];
  onPaymentAdded: () => void;
  onPaymentUpdated: () => void;
}

const PaymentsManager: React.FC<PaymentsManagerProps> = ({
  payments,
  clients,
  subscriptions,
  onPaymentAdded,
  onPaymentUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
    clientId: '',
    subscriptionId: '',
    amount: 0,
    currency: 'EUR',
    paymentDate: Date.now(),
    paymentMethod: 'card',
    status: 'pending',
    transactionId: '',
    notes: ''
  });
  const [transactionId, setTransactionId] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSubscriptions, setClientSubscriptions] = useState<Subscription[]>([]);

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredPayments([]);
      return;
    }

    const results = payments.filter(payment => {
      const client = clients.find(c => c.id === payment.clientId);
      
      if (!client) return false;
      
      return (
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm)
      );
    });
    
    setFilteredPayments(results);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: new Date(value).getTime() }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'clientId') {
      // Filtrer les abonnements pour ce client
      const clientSubs = subscriptions.filter(sub => sub.clientId === value);
      setClientSubscriptions(clientSubs);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subscriptionId: clientSubs.length > 0 ? clientSubs[0].id : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      subscriptionId: '',
      amount: 0,
      currency: 'EUR',
      paymentDate: Date.now(),
      paymentMethod: 'card',
      status: 'pending',
      transactionId: '',
      notes: ''
    });
    setClientSubscriptions([]);
  };

  const handleAddPayment = async () => {
    try {
      setIsLoading(true);
      await addPayment(formData);
      setShowAddDialog(false);
      resetForm();
      onPaymentAdded();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsLoading(true);
      await markPaymentAsCompleted(selectedPayment.id, transactionId);
      setShowCompleteDialog(false);
      setTransactionId('');
      onPaymentUpdated();
    } catch (error) {
      console.error('Erreur lors de la validation du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsLoading(true);
      await refundPayment(selectedPayment.id, refundNotes);
      setShowRefundDialog(false);
      setRefundNotes('');
      onPaymentUpdated();
    } catch (error) {
      console.error('Erreur lors du remboursement du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCompleteDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setTransactionId(payment.transactionId || '');
    setShowCompleteDialog(true);
  };

  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundNotes('');
    setShowRefundDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Complété</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Échoué</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-500">Remboursé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.businessName : 'Client inconnu';
  };

  const getSubscriptionInfo = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return 'Abonnement inconnu';
    
    const plan = subscription.planId;
    return `Abonnement #${subscription.id.substring(0, 6)}`;
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  const displayedPayments = searchTerm.trim() === '' ? payments : filteredPayments;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Rechercher un paiement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Rechercher
          </Button>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau paiement</DialogTitle>
              <DialogDescription>
                Remplissez les informations du paiement ci-dessous.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="clientId" className="text-sm font-medium">Client</label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => handleSelectChange('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subscriptionId" className="text-sm font-medium">Abonnement</label>
                <Select
                  value={formData.subscriptionId}
                  onValueChange={(value) => handleSelectChange('subscriptionId', value)}
                  disabled={clientSubscriptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={clientSubscriptions.length === 0 ? "Sélectionnez d'abord un client" : "Sélectionner un abonnement"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientSubscriptions.map((subscription) => (
                      <SelectItem key={subscription.id} value={subscription.id}>
                        Abonnement #{subscription.id.substring(0, 6)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Montant</label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium">Devise</label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="paymentDate" className="text-sm font-medium">Date de paiement</label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  value={format(new Date(formData.paymentDate), 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('paymentDate', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium">Méthode de paiement</label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleSelectChange('paymentMethod', value as 'card' | 'bank_transfer' | 'paypal' | 'other')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Statut</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value as 'pending' | 'completed' | 'failed' | 'refunded')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                    <SelectItem value="refunded">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="transactionId" className="text-sm font-medium">ID de transaction (optionnel)</label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes (optionnel)</label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button onClick={handleAddPayment} disabled={isLoading}>
                {isLoading ? 'Ajout en cours...' : 'Ajouter le paiement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Abonnement</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm.trim() === '' 
                    ? "Aucun paiement n'a été ajouté." 
                    : "Aucun paiement ne correspond à votre recherche."}
                </TableCell>
              </TableRow>
            ) : (
              displayedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getClientName(payment.clientId)}</TableCell>
                  <TableCell>{getSubscriptionInfo(payment.subscriptionId)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>
                    {payment.paymentMethod === 'card' ? 'Carte' : 
                     payment.paymentMethod === 'bank_transfer' ? 'Virement' : 
                     payment.paymentMethod === 'paypal' ? 'PayPal' : 'Autre'}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === 'pending' && (
                        <Button variant="ghost" size="icon" onClick={() => openCompleteDialog(payment)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="icon" onClick={() => openRefundDialog(payment)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialogue de validation de paiement */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Valider le paiement</DialogTitle>
            <DialogDescription>
              Confirmez que ce paiement a été reçu et complété.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="py-4">
              <p className="font-medium">Client: {getClientName(selectedPayment.clientId)}</p>
              <p className="text-sm text-gray-500">Montant: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(selectedPayment.paymentDate)}</p>
              
              <div className="mt-4 space-y-2">
                <label htmlFor="transactionId" className="text-sm font-medium">ID de transaction</label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Entrez l'ID de transaction (optionnel)"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Annuler</Button>
            <Button onClick={handleCompletePayment} disabled={isLoading}>
              {isLoading ? 'Validation...' : 'Valider le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de remboursement */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rembourser le paiement</DialogTitle>
            <DialogDescription>
              Confirmez que ce paiement a été remboursé au client.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="py-4">
              <p className="font-medium">Client: {getClientName(selectedPayment.clientId)}</p>
              <p className="text-sm text-gray-500">Montant: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(selectedPayment.paymentDate)}</p>
              
              <div className="mt-4 space-y-2">
                <label htmlFor="refundNotes" className="text-sm font-medium">Raison du remboursement</label>
                <Textarea
                  id="refundNotes"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Entrez la raison du remboursement"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleRefundPayment} disabled={isLoading}>
              {isLoading ? 'Remboursement...' : 'Confirmer le remboursement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsManager;
