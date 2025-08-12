import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { getVivaConfigById, updateVivaConfig, testVivaConnection } from '../../services/vivaConfigService';
import { useAuth } from '../../contexts/AuthContext';
import { VivaPaymentsConfig } from '../../types/vivaPaymentsIntegration';
import { VivaTestConfig } from '../../types/vivaTestConfig';

interface VivaClientConfigSectionProps {
  clientId?: string; // ID du client à configurer (optionnel)
}

const VivaClientConfigSection: React.FC<VivaClientConfigSectionProps> = ({ clientId: providedClientId }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<VivaPaymentsConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Fonction pour appliquer les couleurs du thème aux éléments du composant
  const applyThemeColors = () => {
    // Cette fonction sera appelée lorsque le thème change
    // L'utilisation des variables CSS prend déjà en charge les changements de thème
    // Mais on pourrait ajouter ici une logique supplémentaire si nécessaire
    console.log('Thème mis à jour dans VivaClientConfigSection');
  };

  // Écouteur d'événement pour forceThemeUpdate
  useEffect(() => {
    // Ajouter l'écouteur d'événement pour les mises à jour de thème
    window.addEventListener('forceThemeUpdate', applyThemeColors);
    
    // Nettoyage de l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener('forceThemeUpdate', applyThemeColors);
    };
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      // Utiliser l'ID client fourni ou l'ID de l'utilisateur actuel
      const userIdToUse = providedClientId || (currentUser ? currentUser.uid : null);
      
      if (!userIdToUse) return;
      
      try {
        const config = await getVivaConfigById(userIdToUse);
        if (config) {
          setConfig(config);
          setClientId(config.vivaClientId || '');
          setClientSecret(config.vivaClientSecret || '');
          setMerchantId(config.merchantId || '');
          setEnvironment(config.environment || 'sandbox');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration Viva:', error);
      }
    };

    loadConfig();
    // Appliquer les couleurs du thème lors du chargement initial
    applyThemeColors();
  }, [currentUser, providedClientId]);

  const handleSaveConfig = async () => {
    // Utiliser l'ID client fourni ou l'ID de l'utilisateur actuel
    const userIdToUse = providedClientId || (currentUser ? currentUser.uid : null);
    if (!userIdToUse) return;
    
    try {
      const updatedConfig: Partial<VivaPaymentsConfig> = {
        id: config?.id || userIdToUse,
        vivaClientId: clientId,
        vivaClientSecret: clientSecret,
        merchantId: merchantId,
        environment: environment,
        updatedAt: Date.now()
      };
      
      await updateVivaConfig(config?.id || userIdToUse, updatedConfig);
      setIsDialogOpen(false);
      
      // Recharger la configuration
      if (userIdToUse) {
        const newConfig = await getVivaConfigById(userIdToUse);
        setConfig(newConfig);
      }
      
      setTestResult({
        success: true,
        message: 'Configuration Viva Payments enregistrée avec succès!'
      });
      
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      setTestResult({
        success: false,
        message: 'Erreur lors de la sauvegarde de la configuration'
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const testConfig: VivaTestConfig = {
        vivaClientId: clientId,
        vivaClientSecret: clientSecret,
        environment: environment
      };
      
      const result = await testVivaConnection(testConfig);
      
      setTestResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erreur lors du test de connexion'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-primary mt-1" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Configuration Viva Payments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {config ? 'Configurez ou modifiez vos identifiants Viva Payments' : 'Configurez vos identifiants Viva Payments pour accepter les paiements par carte'}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="text-white hover:opacity-90" 
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            borderColor: 'var(--color-primary)'
          }}
        >
          {config ? 'Modifier' : 'Configurer'}
        </Button>
      </div>

      {testResult && (
        <Alert 
          variant={testResult.success ? 'success' : 'destructive'}
          className="mb-4"
        >
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2" />
          )}
          {testResult.message}
        </Alert>
      )}

      {config && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {config.isActive ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Actif
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Inactif
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Environnement</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {config.environment === 'production' ? 'Production' : 'Sandbox (Test)'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Client ID</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">••••••••{config.vivaClientId.slice(-4)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Jamais'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-white">Configuration Viva Payments</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="clientId" className="font-medium dark:text-gray-200">
                Client ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Entrez votre Client ID"
                required
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="clientSecret" className="font-medium dark:text-gray-200">
                Client Secret <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-20"
                  placeholder="Entrez votre Client Secret"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 font-medium"
                  style={{ color: 'var(--color-primary)' }}
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? "Cacher" : "Afficher"}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="merchantId" className="font-medium dark:text-gray-200">
                Merchant ID
              </Label>
              <Input
                id="merchantId"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Entrez votre Merchant ID (optionnel)"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="environment" className="font-medium dark:text-gray-200">
                Environnement
              </Label>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                <Switch
                  id="environment"
                  checked={environment === 'production'}
                  onCheckedChange={(checked: boolean) => setEnvironment(checked ? 'production' : 'sandbox')}
                  style={{
                    '--switch-bg': 'var(--color-primary)',
                    '--switch-ring': 'var(--color-primary-light)'
                  } as React.CSSProperties}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="environment" className="cursor-pointer dark:text-white font-medium">
                  {environment === 'production' ? 'Production' : 'Sandbox (Test)'}
                </Label>
              </div>
            </div>
            
            {testResult && (
              <div className="w-full">
                <Alert 
                  variant={testResult.success ? 'success' : 'destructive'}
                  className="text-sm p-3 flex items-center gap-2"
                >
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </Alert>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection || !clientId || !clientSecret}
              style={{
                borderColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
              className="w-full sm:w-auto py-2 px-4 rounded-md hover:bg-opacity-10 hover:bg-primary dark:bg-gray-700 dark:text-white dark:border-gray-600 flex items-center justify-center"
            >
              {testingConnection ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Test en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Tester la connexion
                </>
              )}
            </Button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                style={{
                  borderColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)'
                }}
                className="w-full sm:w-auto py-2 px-4 rounded-md hover:bg-opacity-10 hover:bg-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSaveConfig}
                disabled={!clientId || !clientSecret}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)'
                }}
                className="w-full sm:w-auto py-2 px-4 rounded-md text-white hover:opacity-90 font-medium"
              >
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VivaClientConfigSection;
