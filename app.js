import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import transactionsRoutes from './routes/transactions.js';

// Charger les variables d'environnement à partir de .env.viva
dotenv.config({ path: path.resolve(process.cwd(), '.env.viva') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utilisation des routes
app.use('/api', transactionsRoutes);

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({
    message: 'API Viva Payments pour PayeSmart',
    version: '1.0.0',
    status: 'OK'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur API Viva Payments démarré sur le port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}`);
  console.log(`URL de base: http://localhost:${PORT}`);
});

export default app;
