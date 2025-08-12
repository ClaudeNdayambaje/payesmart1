import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle2, RefreshCw, Save, Terminal, TestTube } from 'lucide-react';
import { Client } from '../../types/saas';
import { VivaPaymentsConfig, VivaTerminal } from '../../types/vivaPaymentsIntegration';
import { createVivaConfig, updateVivaConfig, testVivaConnection, getVivaConfigById, getTerminalsByConfig, createTerminal, updateTerminal, deleteTerminal } from '../../services/vivaConfigService';
import { Spinner } from '../ui/spinner';
import VivaTerminalList from './VivaTerminalList';
import VivaTerminalForm from './VivaTerminalForm';
import { getCurrentUser } from '../../services/authService';

interface VivaConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  configId?: string;
  onConfigCreated?: (configId: string) => void;
  onConfigUpdated?: () => void;
}

const VivaConfigModal: React.FC<VivaConfigModalProps> = ({
  open,
  onOpenChange,
  client,
  configId,
  onConfigCreated,
  onConfigUpdated
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [terminals, setTerminals] = useState<VivaTerminal[]>([]);
  const [showTerminalForm, setShowTerminalForm] = useState(false);
  const [currentTerminal, setCurrentTerminal] = useState<VivaTerminal | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState<Partial<VivaPaymentsConfig>>({
    clientId: client.id,
    businessId: client.businessId || '',
    vivaClientId: '',
    vivaClientSecret: '',
    vivaMerchantId: '',
    callbackUrl: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    isActive: true
  });

  // Charger la configuration existante si configId est fourni
  useEffect(() => {
    const loadConfig = async () => {
      if (!configId) return;
      
      setLoading(true);
      try {
        const config = await getVivaConfigById(configId);
        if (config) {
          setFormData({
            ...config,
            // Ne pas inclure l'ID car il sera géré séparément
            id: undefined
          });
          
          // Charger les terminaux associés
          const terminalList = await getTerminalsByConfig(configId);
          setTerminals(terminalList);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      loadConfig();
    }
  }, [configId, open]);

  // Gestionnaire de changement de champ
  const handleChange = (field: keyof VivaPaymentsConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async () => {
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      if (configId) {
        // Mise à jour d'une configuration existante
        await updateVivaConfig(configId, formData);
        if (onConfigUpdated) onConfigUpdated();
      } else {
        // Création d'une nouvelle configuration
        const newConfigId = await createVivaConfig(formData as Omit<VivaPaymentsConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>);
        if (onConfigCreated) onConfigCreated(newConfigId);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tester la connexion à l'API Viva Payments
  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      // Créer un objet de configuration temporaire pour le test
      const testConfig: VivaPaymentsConfig = {
        id: configId || 'temp-id',
        clientId: client.id,
        businessId: client.businessId || '',
        vivaClientId: formData.vivaClientId || '',
        vivaClientSecret: formData.vivaClientSecret || '',
        vivaMerchantId: formData.vivaMerchantId,
        environment: formData.environment as 'sandbox' | 'production',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: '',
        updatedBy: '',
        isActive: true
      };
      
      const result = await testVivaConnection(testConfig);
      setTestResult(result);
      
      // Si le test est réussi et qu'un token a été généré, mettre à jour le formulaire
      if (result.success && result.token) {
        setFormData(prev => ({
          ...prev,
          accessToken: result.token,
          tokenExpiry: Date.now() + (3600 * 1000) // 1 heure de validité
        }));
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      setTestResult({
        success: false,
        message: 'Erreur lors du test de connexion à l\'API Viva Payments'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Gérer l'ajout d'un nouveau terminal
  const handleAddTerminal = () => {
    setCurrentTerminal(null);
    setShowTerminalForm(true);
  };

  // Gérer l'édition d'un terminal existant
  const handleEditTerminal = (terminal: VivaTerminal) => {
    setCurrentTerminal(terminal);
    setShowTerminalForm(true);
  };

  // Gérer la suppression d'un terminal
  const handleDeleteTerminal = async (terminalId: string) => {
    try {
      await deleteTerminal(terminalId);
      setTerminals(prev => prev.filter(t => t.id !== terminalId));
    } catch (error) {
      console.error('Erreur lors de la suppression du terminal:', error);
    }
  };

  // Gérer la sauvegarde d'un terminal (création ou mise à jour)
  const handleSaveTerminal = async (terminal: Partial<VivaTerminal>) => {
    try {
      if (currentTerminal) {
        // Mise à jour d'un terminal existant
        await updateTerminal(currentTerminal.id, terminal);
        setTerminals(prev => prev.map(t => 
          t.id === currentTerminal.id ? { ...t, ...terminal } as VivaTerminal : t
        ));
      } else if (configId) {
        // Création d'un nouveau terminal
        const newTerminal: Omit<VivaTerminal, 'id' | 'createdAt' | 'updatedAt'> = {
          configId,
          terminalId: terminal.terminalId || '',
          name: terminal.name || '',
          description: terminal.description,
          location: terminal.location,
          isActive: terminal.isActive || false
        };
        
        const newTerminalId = await createTerminal(newTerminal);
        setTerminals(prev => [...prev, { ...newTerminal, id: newTerminalId, createdAt: Date.now(), updatedAt: Date.now() }]);
      }
      
      setShowTerminalForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du terminal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {configId ? 'Modifier l\'intégration Viva Payments' : 'Configurer l\'intégration Viva Payments'}
          </DialogTitle>
        </DialogHeader>
        
        {loading && !showTerminalForm ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="general">Informations générales</TabsTrigger>
                <TabsTrigger value="terminals" disabled={!configId}>Terminaux</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vivaClientId">Client ID Viva <span className="text-red-500">*</span></Label>
                    <Input
                      id="vivaClientId"
                      value={formData.vivaClientId || ''}
                      onChange={(e) => handleChange('vivaClientId', e.target.value)}
                      placeholder="Entrez le Client ID fourni par Viva"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vivaClientSecret">Client Secret Viva <span className="text-red-500">*</span></Label>
                    <Input
                      id="vivaClientSecret"
                      type="password"
                      value={formData.vivaClientSecret || ''}
                      onChange={(e) => handleChange('vivaClientSecret', e.target.value)}
                      placeholder="Entrez le Client Secret fourni par Viva"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vivaMerchantId">Merchant ID Viva (optionnel)</Label>
                    <Input
                      id="vivaMerchantId"
                      value={formData.vivaMerchantId || ''}
                      onChange={(e) => handleChange('vivaMerchantId', e.target.value)}
                      placeholder="Entrez le Merchant ID si applicable"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environnement</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => handleChange('environment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez l'environnement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="callbackUrl">URL de redirection (Callback)</Label>
                  <Input
                    id="callbackUrl"
                    value={formData.callbackUrl || ''}
                    onChange={(e) => handleChange('callbackUrl', e.target.value)}
                    placeholder="https://votre-domaine.com/api/viva/callback"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                    id="isActive"
                  />
                  <Label htmlFor="isActive">Activer l'intégration</Label>
                </div>
                
                {testResult && (
                  <Alert variant={testResult.success ? "success" : "destructive"}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {testResult.success ? 'Connexion réussie' : 'Échec de connexion'}
                    </AlertTitle>
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testLoading || !formData.vivaClientId || !formData.vivaClientSecret}
                  >
                    {testLoading ? <Spinner size="sm" className="mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                    Tester la connexion
                  </Button>
                  
                  {saveSuccess && (
                    <Alert variant="success" className="py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Configuration enregistrée avec succès</AlertTitle>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="terminals" className="space-y-4 mt-4">
                {showTerminalForm ? (
                  <VivaTerminalForm
                    terminal={currentTerminal}
                    onSave={handleSaveTerminal}
                    onCancel={() => setShowTerminalForm(false)}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Terminaux Viva Payments</h3>
                      <Button onClick={handleAddTerminal}>
                        <Terminal className="w-4 h-4 mr-2" />
                        Ajouter un terminal
                      </Button>
                    </div>
                    
                    <VivaTerminalList
                      terminals={terminals}
                      onEdit={handleEditTerminal}
                      onDelete={handleDeleteTerminal}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          
          {!showTerminalForm && (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.vivaClientId || !formData.vivaClientSecret}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VivaConfigModal;
