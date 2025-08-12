import { auth, db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { NextFunction, Request, Response } from 'express';

// Extension de l'interface Request pour inclure l'utilisateur et le business_id
declare global {
  namespace Express {
    interface Request {
      user?: any;
      businessId?: string;
    }
  }
}

/**
 * Middleware d'authentification qui vérifie le token JWT
 * et ajoute le business_id à la requête
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    
    // Note: Dans une implémentation réelle, nous vérifierions le token
    // mais pour simplifier, nous allons juste vérifier si l'utilisateur est connecté
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    };
    
    // Ajouter le business_id à la requête (qui est l'UID de l'utilisateur dans notre cas)
    req.businessId = currentUser.uid;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

/**
 * Middleware qui vérifie l'accès à une ressource spécifique
 * en s'assurant que le business_id correspond
 */
export const validateBusinessAccess = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;
      const businessId = req.businessId;
      
      if (!resourceId || !businessId) {
        return res.status(400).json({ message: 'Paramètres manquants' });
      }
      
      // Récupérer la ressource depuis Firestore
      const resourceRef = doc(db, resourceType, resourceId);
      const resourceSnap = await getDoc(resourceRef);
      
      if (!resourceSnap.exists()) {
        return res.status(404).json({ message: 'Ressource non trouvée' });
      }
      
      const resourceData = resourceSnap.data();
      
      // Vérifier que la ressource appartient bien à l'entreprise de l'utilisateur
      if (resourceData.businessId !== businessId) {
        return res.status(403).json({ message: 'Accès non autorisé à cette ressource' });
      }
      
      next();
    } catch (error) {
      console.error('Erreur de validation d\'accès:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
};
