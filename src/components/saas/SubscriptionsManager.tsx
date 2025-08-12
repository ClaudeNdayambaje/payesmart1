import React, { useState, useEffect } from 'react';
import { Client, Subscription, SubscriptionPlan } from '../../types/saas';
import { addSubscription, updateSubscription, cancelSubscription, hasActiveSubscriptionByEmail, hasActiveSubscription, deleteSubscription } from '../../services/subscriptionService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Plus, Edit, X, Ban, Trash2, MoreVertical } from 'lucide-react';
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
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionsManagerProps {
  subscriptions: Subscription[];
  clients: Client[];
  plans: SubscriptionPlan[];
  onSubscriptionAdded: () => void;
  onSubscriptionUpdated: () => void;
  onSubscriptionCancelled: () => void;
}

const SubscriptionsManager: React.FC<SubscriptionsManagerProps> = ({
  subscriptions,
  clients,
  plans,
  onSubscriptionAdded,
  onSubscriptionUpdated,
  onSubscriptionCancelled
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>({
    clientId: '',
    planId: '',
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // +30 jours par défaut
    status: 'active',
    autoRenew: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fonction pour filtrer les clients sans abonnement actif
  const getAvailableClients = () => {
    // Création d'un ensemble d'IDs de clients avec des abonnements actifs
    const clientsWithActiveSubscriptions = new Set();
    
    // Parcourir tous les abonnements pour identifier les clients ayant un abonnement actif
    subscriptions.forEach(subscription => {
      if (subscription.status === 'active') {
        clientsWithActiveSubscriptions.add(subscription.clientId);
      }
    });
    
    // Ne conserver que les clients qui n'ont pas d'abonnement actif
    return clients.filter(client => !clientsWithActiveSubscriptions.has(client.id));
  };
  
  // Exécuter le filtrage des clients quand la liste de clients ou d'abonnements change
  useEffect(() => {
    const availableClientsList = getAvailableClients();
    setAvailableClients(availableClientsList);
  }, [clients, subscriptions]);
  
  // Rafraîchir la liste des clients disponibles après l'ajout d'un abonnement
  useEffect(() => {
    if (!showAddDialog) {
      const availableClientsList = getAvailableClients();
      setAvailableClients(availableClientsList);
    }
  }, [showAddDialog]);
  
  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredSubscriptions([]);
      return;
    }

    const results = subscriptions.filter(subscription => {
      const client = clients.find(c => c.id === subscription.clientId);
      const plan = plans.find(p => p.id === subscription.planId);
      
      if (!client || !plan) return false;
      
      return (
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    setFilteredSubscriptions(results);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: new Date(value).getTime() }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      planId: '',
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: 'active',
      autoRenew: true
    });
  };

  const handleAddSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer l'email du client sélectionné
      const selectedClient = clients.find(client => client.id === formData.clientId);
      
      if (!selectedClient) {
        setError("Client non trouvé. Veuillez sélectionner un client valide.");
        return;
      }
      
      // Vérifier si le client a déjà un abonnement actif avec cet email
      const { hasSubscription } = await hasActiveSubscriptionByEmail(selectedClient.email);
      
      if (hasSubscription) {
        setError(`Le client avec l'email ${selectedClient.email} a déjà un abonnement actif. Un seul abonnement actif est autorisé par adresse email.`);
        return;
      }
      
      // Ajouter l'abonnement en passant l'email du client pour une vérification supplémentaire
      await addSubscription(formData, selectedClient.email);
      setShowAddDialog(false);
      resetForm();
      onSubscriptionAdded();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'abonnement:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'ajout de l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      setIsLoading(true);
      await updateSubscription(selectedSubscription.id, formData);
      setShowEditDialog(false);
      onSubscriptionUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      setIsLoading(true);
      await cancelSubscription(selectedSubscription.id);
      setShowCancelDialog(false);
      onSubscriptionCancelled();
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour ouvrir la boîte de dialogue de suppression
  const openDeleteDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteDialog(true);
  };
  
  // Fonction pour supprimer définitivement un abonnement
  const handleDeleteSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      setIsLoading(true);
      await deleteSubscription(selectedSubscription.id);
      setShowDeleteDialog(false);
      onSubscriptionCancelled(); // Réutilisation de la même fonction de callback
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      clientId: subscription.clientId,
      planId: subscription.planId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
      autoRenew: subscription.autoRenew
    });
    setShowEditDialog(true);
  };

  const openCancelDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Annulé</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500">Expiré</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.businessName : 'Client inconnu';
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Plan inconnu';
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: fr });
  };

  const displayedSubscriptions = searchTerm.trim() === '' ? subscriptions : filteredSubscriptions;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Rechercher un abonnement..."
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
              Ajouter un nouvel abonnement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel abonnement</DialogTitle>
              <DialogDescription>
                Remplissez les informations de l'abonnement ci-dessous.
              </DialogDescription>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}
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
                    {availableClients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>
                        Aucun client sans abonnement disponible
                      </SelectItem>
                    ) : (
                      availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.businessName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="planId" className="text-sm font-medium">Plan d'abonnement</label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => handleSelectChange('planId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price} €/{plan.billingCycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">Date de début</label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={format(new Date(formData.startDate), 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">Date de fin</label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={format(new Date(formData.endDate), 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Statut</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value as 'active' | 'cancelled' | 'expired' | 'pending')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => handleCheckboxChange('autoRenew', checked as boolean)}
                />
                <label
                  htmlFor="autoRenew"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Renouvellement automatique
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button onClick={handleAddSubscription} disabled={isLoading}>
                {isLoading ? 'Ajout en cours...' : 'Ajouter l\'abonnement'}
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
              <TableHead>Plan</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Renouvellement auto</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm.trim() === '' 
                    ? "Aucun abonnement n'a été ajouté." 
                    : "Aucun abonnement ne correspond à votre recherche."}
                </TableCell>
              </TableRow>
            ) : (
              displayedSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">{getClientName(subscription.clientId)}</TableCell>
                  <TableCell>{getPlanName(subscription.planId)}</TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>{formatDate(subscription.endDate)}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{subscription.autoRenew ? 'Oui' : 'Non'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(subscription)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {subscription.status === 'active' && (
                            <DropdownMenuItem onClick={() => openCancelDialog(subscription)} className="cursor-pointer">
                              <Ban className="w-4 h-4 mr-2" />
                              <span>Annuler l'abonnement</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openDeleteDialog(subscription)} className="cursor-pointer text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span>Supprimer définitivement</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialogue de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'abonnement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'abonnement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-clientId" className="text-sm font-medium">Client</label>
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
              <label htmlFor="edit-planId" className="text-sm font-medium">Plan d'abonnement</label>
              <Select
                value={formData.planId}
                onValueChange={(value) => handleSelectChange('planId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price} €/{plan.billingCycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-startDate" className="text-sm font-medium">Date de début</label>
              <Input
                id="edit-startDate"
                name="startDate"
                type="date"
                value={format(new Date(formData.startDate), 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-endDate" className="text-sm font-medium">Date de fin</label>
              <Input
                id="edit-endDate"
                name="endDate"
                type="date"
                value={format(new Date(formData.endDate), 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-status" className="text-sm font-medium">Statut</label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as 'active' | 'cancelled' | 'expired' | 'pending')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-autoRenew"
                checked={formData.autoRenew}
                onCheckedChange={(checked) => handleCheckboxChange('autoRenew', checked as boolean)}
              />
              <label
                htmlFor="edit-autoRenew"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Renouvellement automatique
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleEditSubscription} disabled={isLoading}>
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue d'annulation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cet abonnement ? Le client n'aura plus accès au service à la fin de la période en cours.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="py-4">
              <p className="font-medium">Client: {getClientName(selectedSubscription.clientId)}</p>
              <p className="text-sm text-gray-500">Plan: {getPlanName(selectedSubscription.planId)}</p>
              <p className="text-sm text-gray-500">Fin: {formatDate(selectedSubscription.endDate)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Retour</Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={isLoading}>
              {isLoading ? 'Annulation...' : 'Annuler l\'abonnement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cet abonnement ? Cette action est irréversible et toutes les données associées seront perdues.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="py-4">
              <p className="font-medium">Client: {getClientName(selectedSubscription.clientId)}</p>
              <p className="text-sm text-gray-500">Plan: {getPlanName(selectedSubscription.planId)}</p>
              <p className="text-sm text-gray-500">Statut: {getStatusBadge(selectedSubscription.status)}</p>
              <p className="text-sm text-gray-500">Période: {formatDate(selectedSubscription.startDate)} - {formatDate(selectedSubscription.endDate)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteSubscription} disabled={isLoading}>
              {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsManager;
