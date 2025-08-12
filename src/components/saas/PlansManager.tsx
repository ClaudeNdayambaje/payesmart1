import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types/saas';
import { addSubscriptionPlan, updateSubscriptionPlan } from '../../services/subscriptionService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Edit, Check, X } from 'lucide-react';
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
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface PlansManagerProps {
  plans: SubscriptionPlan[];
  onPlanAdded: () => void;
  onPlanUpdated: () => void;
}

const PlansManager: React.FC<PlansManagerProps> = ({
  plans,
  onPlanAdded,
  onPlanUpdated
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
    isActive: true,
    maxUsers: 1,
    maxStores: 1
  });
  const [featureInput, setFeatureInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'maxUsers' || name === 'maxStores') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddFeature = () => {
    if (featureInput.trim() === '') return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      features: [],
      isActive: true,
      maxUsers: 1,
      maxStores: 1
    });
    setFeatureInput('');
  };

  const handleAddPlan = async () => {
    try {
      setIsLoading(true);
      await addSubscriptionPlan(formData);
      setShowAddDialog(false);
      resetForm();
      onPlanAdded();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = async () => {
    if (!selectedPlan) return;

    try {
      setIsLoading(true);
      await updateSubscriptionPlan(selectedPlan.id, formData);
      setShowEditDialog(false);
      onPlanUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: [...plan.features],
      isActive: plan.isActive,
      maxUsers: plan.maxUsers,
      maxStores: plan.maxStores
    });
    setShowEditDialog(true);
  };

  const formatPrice = (price: number, billingCycle: string) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Mensuel';
      case 'quarterly':
        return 'Trimestriel';
      case 'biannually':
        return 'Semestriel';
      case 'annually':
        return 'Annuel';
      default:
        return cycle;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Plans d'abonnement</h2>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau plan</DialogTitle>
              <DialogDescription>
                Définissez les détails du nouveau plan d'abonnement.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nom du plan</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="billingCycle" className="text-sm font-medium">Cycle de facturation</label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => handleSelectChange('billingCycle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="biannually">Semestriel</SelectItem>
                      <SelectItem value="annually">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">Prix</label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="maxUsers" className="text-sm font-medium">Utilisateurs max</label>
                  <Input
                    id="maxUsers"
                    name="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="maxStores" className="text-sm font-medium">Magasins max</label>
                  <Input
                    id="maxStores"
                    name="maxStores"
                    type="number"
                    value={formData.maxStores}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Plan actif</Label>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Fonctionnalités</label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Ajouter une fonctionnalité"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFeature}>
                    Ajouter
                  </Button>
                </div>
                
                <div className="mt-2 space-y-2">
                  {formData.features.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune fonctionnalité ajoutée</p>
                  ) : (
                    <ul className="space-y-1">
                      {formData.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                          <span>{feature}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFeature(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button onClick={handleAddPlan} disabled={isLoading}>
                {isLoading ? 'Ajout en cours...' : 'Ajouter le plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Utilisateurs</TableHead>
              <TableHead>Magasins</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucun plan d'abonnement n'a été ajouté.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatPrice(plan.price, plan.billingCycle)}</TableCell>
                  <TableCell>{getBillingCycleLabel(plan.billingCycle)}</TableCell>
                  <TableCell>{plan.maxUsers}</TableCell>
                  <TableCell>{plan.maxStores}</TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Badge className="bg-green-500">Actif</Badge>
                    ) : (
                      <Badge className="bg-gray-500">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialogue de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le plan</DialogTitle>
            <DialogDescription>
              Modifiez les détails du plan d'abonnement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Nom du plan</label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-billingCycle" className="text-sm font-medium">Cycle de facturation</label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => handleSelectChange('billingCycle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="biannually">Semestriel</SelectItem>
                    <SelectItem value="annually">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-price" className="text-sm font-medium">Prix</label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-maxUsers" className="text-sm font-medium">Utilisateurs max</label>
                <Input
                  id="edit-maxUsers"
                  name="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-maxStores" className="text-sm font-medium">Magasins max</label>
                <Input
                  id="edit-maxStores"
                  name="maxStores"
                  type="number"
                  value={formData.maxStores}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
              />
              <Label htmlFor="edit-isActive">Plan actif</Label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Fonctionnalités</label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Ajouter une fonctionnalité"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature}>
                  Ajouter
                </Button>
              </div>
              
              <div className="mt-2 space-y-2">
                {formData.features.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune fonctionnalité ajoutée</p>
                ) : (
                  <ul className="space-y-1">
                    {formData.features.map((feature, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                        <span>{feature}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleEditPlan} disabled={isLoading}>
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansManager;
