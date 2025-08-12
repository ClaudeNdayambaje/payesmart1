import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { CreditCard } from 'lucide-react';
import { Client } from '../../types/saas';
import { VivaPaymentsConfig } from '../../types/vivaPaymentsIntegration';
import { getVivaConfigsByClient } from '../../services/vivaConfigService';
import VivaConfigModal from './VivaConfigModal';

interface VivaConfigButtonProps {
  client: Client;
  onConfigCreated?: () => void;
  onConfigUpdated?: () => void;
}

const VivaConfigButton: React.FC<VivaConfigButtonProps> = ({
  client,
  onConfigCreated,
  onConfigUpdated
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingConfig, setExistingConfig] = useState<VivaPaymentsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Vérifier si le client a déjà une configuration Viva Payments
  useEffect(() => {
    const checkExistingConfig = async () => {
      setLoading(true);
      try {
        const configs = await getVivaConfigsByClient(client.id);
        if (configs.length > 0) {
          setExistingConfig(configs[0]);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la configuration Viva:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingConfig();
  }, [client.id]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleConfigCreated = (configId: string) => {
    if (onConfigCreated) {
      onConfigCreated();
    }
    // Recharger les configurations
    getVivaConfigsByClient(client.id).then(configs => {
      if (configs.length > 0) {
        setExistingConfig(configs[0]);
      }
    });
  };

  const handleConfigUpdated = () => {
    if (onConfigUpdated) {
      onConfigUpdated();
    }
    // Recharger les configurations
    getVivaConfigsByClient(client.id).then(configs => {
      if (configs.length > 0) {
        setExistingConfig(configs[0]);
      }
    });
  };

  return (
    <>
      <Button
        variant={existingConfig ? "outline" : "default"}
        size="sm"
        onClick={handleOpenModal}
        disabled={loading}
        className={existingConfig?.isActive ? "border-green-500" : ""}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {existingConfig 
          ? (existingConfig.isActive ? "Viva Configuré" : "Éditer Viva") 
          : "Configurer Viva.com"
        }
      </Button>

      <VivaConfigModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={client}
        configId={existingConfig?.id}
        onConfigCreated={handleConfigCreated}
        onConfigUpdated={handleConfigUpdated}
      />
    </>
  );
};

export default VivaConfigButton;
