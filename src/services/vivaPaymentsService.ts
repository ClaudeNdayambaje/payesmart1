// Utiliser notre wrapper axios personnalisé qui fonctionne à la fois en développement et en production
import axios from '../utils/axiosWrapper';
import { formatVivaErrorForUser, parseVivaError } from '../utils/vivaErrorHandler';

// Interface pour les réponses de l'API Viva Payments
interface VivaTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// Mode simulation (true = mode simulation activé, false = utilisation de l'API réelle)
const SIMULATION_MODE = false;

class VivaPaymentsService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly isDevelopment: boolean;
  private readonly baseApiUrl: string;

  constructor(isDevelopment = true) {
    this.isDevelopment = isDevelopment;
    this.baseApiUrl = 'https://us-central1-logiciel-de-caisse-7e58e.cloudfunctions.net/vivaPayments';
    
    console.log('Service Viva Payments initialisé en mode ' + (isDevelopment ? 'Développement' : 'Production'));
    console.log('URL de l\'API Viva Payments: ' + this.baseApiUrl);
  }

  /**
   * Obtient un jeton d'accès valide pour l'API Viva Payments
   * Réutilise le jeton existant s'il est encore valide
   */
  async getAccessToken(): Promise<string> {
    try {
      // Si le mode simulation est activé, retourner un token simulé
      if (SIMULATION_MODE) {
        console.log('MODE SIMULATION: Génération d\'un token simulé');
        this.token = 'simulated-viva-token-' + Date.now();
        this.tokenExpiry = Date.now() + (3600 * 1000); // 1 heure de validité
        return this.token;
      }

      // Si nous avons déjà un token valide, on le retourne
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        console.log('Utilisation du token existant');
        return this.token;
      }

      console.log('Demande d\'un nouveau token via le proxy...');
      const proxyUrl = `${this.baseApiUrl}/viva/token`;
      
      const response = await axios.post<VivaTokenResponse>(proxyUrl, {}, {
        timeout: 15000
      });

      this.token = response.data.access_token;
      // Calculer l'expiration du token (en millisecondes)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      console.log('Nouveau token obtenu. Expire dans:', response.data.expires_in, 'secondes');
      
      console.log('Nouveau jeton Viva Payments obtenu avec succès via le proxy');
      return this.token;
    } catch (error: any) {
      console.error('Erreur lors de l\'obtention du jeton Viva Payments:');
      
      if (error.response) {
        console.error('Réponse d\'erreur du serveur proxy:', error.response.status);
        console.error('Données de réponse:', error.response.data);
        throw new Error(`Échec d'authentification: ${error.response.data?.error || 'Erreur inconnue'}`);
      } else if (error.request) {
        console.error('Aucune réponse reçue du serveur proxy. Est-ce que le serveur proxy est démarré?');
        throw new Error('Erreur de connexion au serveur proxy. Assurez-vous que "node server.js" est en cours d\'exécution.');
      } else {
        console.error('Erreur de configuration de la requête:', error.message);
        throw new Error(`Erreur de configuration: ${error.message}`);
      }
    }
  }

  /**
   * Effectue un appel API sécurisé vers Viva Payments avec le token d'authentification
   */
  async apiCall<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    try {
      // Obtenir un token valide
      const token = await this.getAccessToken();
      
      // Vérifier que le token est disponible
      if (!token) {
        throw new Error('Token d\'authentification non disponible');
      }
      
      // Construire l'URL de base en fonction de l'environnement
      const baseApiUrl = this.isDevelopment
        ? 'https://demo-api.vivapayments.com'
        : 'https://api.vivapayments.com';
      
      // Effectuer l'appel API avec axios
      const response = await axios({
        method,
        url: `${baseApiUrl}/${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: data || undefined,
        timeout: 15000 // 15 secondes
      });
      
      return response.data as T;
    } catch (error) {
      console.error(`Erreur lors de l'appel API Viva Payments (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Génère un UUID v4 pour l'identification unique des sessions
   * @returns UUID v4 sous forme de chaîne
   */
  private generateUUID(): string {
    // Implémentation simple d'UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Exemple: Initier une transaction de vente
   */
  async createSaleTransaction(amount: number, merchantTrns: string): Promise<any> {
    try {
      // URL du proxy local qui transmettra la requête à l'API Viva
      const proxyUrl = `${this.baseApiUrl}/viva/transactions`;
      
      console.log('Envoi d\'une demande de paiement au terminal via Cloud Terminal API. Montant:', amount);
      
      // Convertir le montant en centimes comme exigé par l'API Viva
      const amountInCents = Math.round(amount * 100);
      
      // Générer un UUID unique pour cette session
      const sessionId = this.generateUUID();
      
      // Préparer la requête selon le format de l'API Cloud Terminal
      const payload = {
        sessionId: sessionId,
        amount: amountInCents,
        merchantTrns: merchantTrns,
        // Les autres paramètres requis seront ajoutés par le proxy
      };
      
      console.log('Payload de la requête:', payload);
      
      const response = await axios.post(proxyUrl, payload, { 
        timeout: 60000 // Augmenter le timeout car la communication avec le terminal peut prendre du temps
      });
      
      // Pour l'API Cloud Terminal, la réponse peut être vide (code 200 sans contenu)
      console.log('Réponse du serveur proxy:', response.data || 'Pas de contenu (succès)');
      
      // Retourner une réponse appropriée
      return {
        success: true,
        sessionId: sessionId,
        message: 'Veuillez compléter le paiement sur le terminal de paiement.',
        amount: amountInCents
      };
    } catch (error: any) {
      console.error('Erreur lors de la création de transaction:', error);
      
      // Utiliser notre gestionnaire d'erreurs pour obtenir des messages détaillés
      const { userMessage, technicalDetails } = formatVivaErrorForUser(error);
      
      // Journaliser les détails techniques pour le débogage
      console.error('Détails techniques de l\'erreur Viva Payments:', technicalDetails);
      
      // Extraire plus d'informations pour un meilleur diagnostic
      const parsedError = parseVivaError(error);
      
      // Journaliser des informations spécifiques pour le débogage
      if (parsedError.errorId) {
        console.error(`Code d'erreur Viva: ${parsedError.errorId}`);
      }
      
      if (parsedError.eventId) {
        console.error(`ID d'événement Viva: ${parsedError.eventId}`);
      }
      
      // Générer un message d'erreur utilisateur convivial
      throw new Error(userMessage);
    }
  }

  /**
   * Exemple: Effectuer un remboursement
   */
  async refundTransaction(transactionId: string, amount: number): Promise<any> {
    return this.apiCall(`/checkout/v2/transactions/${transactionId}/refund`, 'POST', {
      amount: amount
    });
  }
}

// Création d'une instance avec le mode développement activé par défaut
const vivaPaymentsService = new VivaPaymentsService(
  process.env.NODE_ENV !== 'production' // true si en mode développement
);

export default vivaPaymentsService;
