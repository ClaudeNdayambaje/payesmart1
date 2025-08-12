// Interface pour les données de test de l'API Viva Payments
export interface VivaTestConfig {
  vivaClientId: string;
  vivaClientSecret: string;
  environment: 'sandbox' | 'production';
}
