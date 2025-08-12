import express from 'express';
import {
  getTerminals,
  initiatePayment,
  initiateRefund,
  getSessionStatus,
  getSessionsByDate,
  abortSession,
  handleWebhook
} from '../controllers/vivaController.js';

const router = express.Router();

// Route pour obtenir un token d'accès
// Cette route n'est pas exposée car la gestion du token se fait automatiquement

// Route pour obtenir la liste des terminaux disponibles
router.get('/terminals', getTerminals);

// Route pour initier un paiement
router.post('/payment', initiatePayment);

// Route compatible avec le frontend existant
router.post('/viva/transactions', initiatePayment);

// Route pour initier un remboursement
router.post('/refund', initiateRefund);

// Route pour récupérer le statut d'une session
router.get('/session/:sessionId', getSessionStatus);

// Route pour récupérer les sessions par date
router.get('/sessions', getSessionsByDate);

// Route pour annuler une session en cours
router.delete('/session/:sessionId', abortSession);

// Route pour recevoir les webhooks de Viva
router.post('/webhook', handleWebhook);

export default router;
