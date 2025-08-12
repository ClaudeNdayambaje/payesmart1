import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentBusinessId } from '../../services/businessService';
import { Client } from '../../types/saas';

interface TrialPeriodBadgeProps {
  className?: string;
}

const TrialPeriodBadge: React.FC<TrialPeriodBadgeProps> = ({ className = '' }) => {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialActive, setTrialActive] = useState(false);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'ID de l'entreprise
        const businessId = await getCurrentBusinessId();
        
        // Récupérer le client SaaS associé à cette entreprise
        const SAAS_CLIENTS_COLLECTION = 'saas_clients';
        const clientsQuery = query(
          collection(db, SAAS_CLIENTS_COLLECTION),
          where('businessId', '==', businessId)
        );
        
        const clientsSnapshot = await getDocs(clientsQuery);
        
        if (!clientsSnapshot.empty) {
          // Récupérer les données du client SaaS
          const clientData = clientsSnapshot.docs[0].data() as Client;
          
          // Vérifier si le client est en période d'essai
          if (clientData.isInTrial && clientData.trialEndDate) {
            // Calculer le nombre de jours restants
            const now = Date.now();
            const msRemaining = clientData.trialEndDate - now;
            const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
            
            console.log(`[TrialPeriodBadge] Période d'essai: ${daysRemaining} jours restants`);
            console.log(`[TrialPeriodBadge] Informations de période:`, clientData.trialInfo);
            
            // Mettre à jour l'état du composant
            setDaysRemaining(daysRemaining > 0 ? daysRemaining : 0);
            setTrialActive(daysRemaining > 0);
          } else {
            console.log('[TrialPeriodBadge] Client non en période d\'essai ou date de fin manquante');
            setTrialActive(false);
          }
        } else {
          console.log(`[TrialPeriodBadge] Aucun client SaaS trouvé pour l'entreprise ${businessId}`);
          
          // Essayer de récupérer les données de l'entreprise comme solution de secours
          const businessRef = doc(db, 'businesses', businessId);
          const businessDoc = await getDoc(businessRef);
          
          if (businessDoc.exists()) {
            const businessData = businessDoc.data();
            const trialStartDate = businessData.trialStartDate?.toDate ? businessData.trialStartDate.toDate() : null;
            const trialEndDate = businessData.trialEndDate?.toDate ? businessData.trialEndDate.toDate() : null;
            
            if (trialStartDate && trialEndDate) {
              // Calculer le nombre de jours restants
              const now = new Date();
              const msRemaining = trialEndDate.getTime() - now.getTime();
              const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
              
              console.log(`[TrialPeriodBadge] Période d'essai (données de secours): ${daysRemaining} jours restants`);
              
              setDaysRemaining(daysRemaining > 0 ? daysRemaining : 0);
              setTrialActive(daysRemaining > 0);
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du statut de la période d\'essai:', error);
        setLoading(false);
      }
    };
    
    fetchTrialStatus();
  }, []);
  
  // Pour les tests et le développement, toujours afficher la pastille
  // En production, on n'afficherait que si l'essai est actif
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment && (loading || !trialActive || daysRemaining === null)) {
    return null;
  }
  
  // Utiliser une valeur par défaut pour les tests
  const remainingDays = daysRemaining !== null ? daysRemaining : 14;
  
  // Déterminer la couleur de la pastille en fonction du nombre de jours restants
  let badgeColor = 'bg-green-100 text-green-800';
  if (remainingDays <= 3) {
    badgeColor = 'bg-red-100 text-red-800';
  } else if (remainingDays <= 7) {
    badgeColor = 'bg-yellow-100 text-yellow-800';
  }
  
  return (
    <div className={`${className} flex items-center`}>
      <div className={`px-3 py-1 rounded-full ${badgeColor} text-sm font-medium flex items-center`}>
        <span className="mr-1 h-2 w-2 rounded-full bg-current"></span>
        <span>
          {remainingDays === 1 ? (
            'Dernier jour d\'essai'
          ) : (
            `${remainingDays} jours d'essai restants`
          )}
        </span>
      </div>
    </div>
  );
};

export default TrialPeriodBadge;
