import { v4 as uuidv4 } from 'uuid';
import { post, get, del } from '../utils/http.js';
import { saveTransaction, updateTransactionStatus, findTransactionBySessionId } from '../firebase.js';

/**
 * Obtient la liste des terminaux disponibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getTerminals = async (req, res) => {
  try {
    const response = await post('/ecr/v1/devices:search', {
      statusId: 1 // Uniquement les terminaux en état "Live"
    });
    
    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des terminaux:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des terminaux',
        message: error.message
      });
    }
  }
};

/**
 * Initie une transaction de paiement
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const initiatePayment = async (req, res) => {
  try {
    const { 
      terminalId, 
      cashRegisterId, 
      amount, 
      currencyCode = '978', // EUR par défaut
      merchantReference, 
      customerTrns,
      tipAmount = 0,
      maxInstalments = 0,
      showReceipt = true
    } = req.body;
    
    // Validation des données
    if (!terminalId || !cashRegisterId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Paramètres manquants',
        message: 'Les paramètres terminalId, cashRegisterId et amount sont requis'
      });
    }
    
    // Génération d'un ID de session unique
    const sessionId = uuidv4();
    
    // Préparation des données de transaction
    const paymentData = {
      sessionId,
      terminalId,
      cashRegisterId,
      amount: parseInt(amount, 10),
      currencyCode,
      merchantReference: merchantReference || `VENTE-${Date.now()}`,
      customerTrns: customerTrns || `CLIENT-${Date.now()}`,
      maxInstalments: parseInt(maxInstalments, 10),
      tipAmount: parseInt(tipAmount, 10),
      showTransactionResult: true,
      showReceipt
    };
    
    console.log('Initiation du paiement:', JSON.stringify(paymentData, null, 2));
    
    // Sauvegarder la transaction dans Firebase
    const transactionId = await saveTransaction({
      ...paymentData,
      type: 'payment',
      initiatedAt: new Date().toISOString()
    });
    
    // Envoyer la demande à Viva Payments
    await post('/ecr/v1/transactions:sale', paymentData);
    
    // La réponse est vide (code 200) si la demande est acceptée
    res.json({
      success: true,
      message: 'Paiement initié avec succès',
      sessionId,
      transactionId,
      terminalId,
      cashRegisterId
    });
  } catch (error) {
    console.error('Erreur lors de l\'initiation du paiement:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'initiation du paiement',
        message: error.message
      });
    }
  }
};

/**
 * Initie un remboursement
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const initiateRefund = async (req, res) => {
  try {
    const { 
      terminalId, 
      cashRegisterId, 
      parentSessionId, 
      amount, 
      currencyCode = '978', // EUR par défaut
      merchantReference, 
      customerTrns,
      showReceipt = true
    } = req.body;
    
    // Validation des données
    if (!terminalId || !cashRegisterId || !parentSessionId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Paramètres manquants',
        message: 'Les paramètres terminalId, cashRegisterId, parentSessionId et amount sont requis'
      });
    }
    
    // Génération d'un ID de session unique
    const sessionId = uuidv4();
    
    // Préparation des données de remboursement
    const refundData = {
      sessionId,
      terminalId,
      cashRegisterId,
      parentSessionId,
      amount: parseInt(amount, 10),
      currencyCode,
      merchantReference: merchantReference || `REMB-${Date.now()}`,
      customerTrns: customerTrns || `CLIENT-REMB-${Date.now()}`,
      showTransactionResult: true,
      showReceipt
    };
    
    console.log('Initiation du remboursement:', JSON.stringify(refundData, null, 2));
    
    // Sauvegarder la transaction dans Firebase
    const transactionId = await saveTransaction({
      ...refundData,
      type: 'refund',
      initiatedAt: new Date().toISOString()
    });
    
    // Envoyer la demande à Viva Payments
    await post('/ecr/v1/transactions:refund', refundData);
    
    // La réponse est vide (code 200) si la demande est acceptée
    res.json({
      success: true,
      message: 'Remboursement initié avec succès',
      sessionId,
      transactionId,
      terminalId,
      cashRegisterId,
      parentSessionId
    });
  } catch (error) {
    console.error('Erreur lors de l\'initiation du remboursement:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'initiation du remboursement',
        message: error.message
      });
    }
  }
};

/**
 * Récupère le statut d'une session de transaction
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Paramètre manquant',
        message: 'L\'ID de session est requis'
      });
    }
    
    // Récupérer le statut depuis l'API Viva
    const sessionData = await get(`/ecr/v1/sessions/${sessionId}`);
    
    // Mettre à jour le statut dans Firebase
    const transaction = await findTransactionBySessionId(sessionId);
    if (transaction) {
      const status = sessionData.isSuccess ? 'completed' : 'failed';
      await updateTransactionStatus(transaction.id, status, {
        responseData: sessionData,
        completedAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de session:', error);
    
    // Si l'erreur est 404, la session est probablement en cours de traitement
    if (error.response && error.response.status === 404) {
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Transaction en cours de traitement',
        sessionId: req.params.sessionId
      });
    }
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération du statut',
        message: error.message
      });
    }
  }
};

/**
 * Récupère les transactions par date
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getSessionsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    // Construction de l'URL en fonction des paramètres
    let endpoint = '/ecr/v1/sessions';
    if (date) {
      endpoint += `?date=${date}`;
    }
    
    const sessions = await get(endpoint);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des sessions',
        message: error.message
      });
    }
  }
};

/**
 * Annule une session en cours
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const abortSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { cashRegisterId } = req.query;
    
    if (!sessionId || !cashRegisterId) {
      return res.status(400).json({ 
        success: false,
        error: 'Paramètres manquants',
        message: 'Les paramètres sessionId et cashRegisterId sont requis'
      });
    }
    
    // Envoyer la demande d'annulation à l'API Viva
    await del(`/ecr/v1/sessions/${sessionId}`, { cashRegisterId });
    
    // Mettre à jour le statut dans Firebase
    const transaction = await findTransactionBySessionId(sessionId);
    if (transaction) {
      await updateTransactionStatus(transaction.id, 'aborted', {
        abortedAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Session annulée avec succès',
      sessionId
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la session:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'annulation de la session',
        message: error.message
      });
    }
  }
};

/**
 * Traite les notifications de webhook Viva
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('Notification webhook reçue:', JSON.stringify(webhookData, null, 2));
    
    // Vérification des données minimales nécessaires
    if (!webhookData || !webhookData.sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Données de webhook invalides',
        message: 'Le sessionId est requis'
      });
    }
    
    // Rechercher la transaction correspondante
    const transaction = await findTransactionBySessionId(webhookData.sessionId);
    
    if (!transaction) {
      console.warn(`Aucune transaction trouvée pour le sessionId: ${webhookData.sessionId}`);
      // Retourner quand même un succès pour éviter les retentatives du webhook
      return res.status(200).json({
        success: true,
        message: 'Notification reçue, mais aucune transaction correspondante trouvée'
      });
    }
    
    // Déterminer le statut en fonction des données du webhook
    let status = 'unknown';
    if (webhookData.isSuccess === true) {
      status = 'completed';
    } else if (webhookData.isSuccess === false) {
      status = 'failed';
    } else if (webhookData.abortOperation === true) {
      status = 'aborted';
    }
    
    // Mettre à jour le statut dans Firebase
    await updateTransactionStatus(transaction.id, status, {
      webhookData,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification traitée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    
    // Toujours renvoyer un succès pour éviter les retentatives du webhook
    res.status(200).json({
      success: true,
      message: 'Notification reçue, mais erreur lors du traitement'
    });
  }
};

export default {
  getTerminals,
  initiatePayment,
  initiateRefund,
  getSessionStatus,
  getSessionsByDate,
  abortSession,
  handleWebhook
};
