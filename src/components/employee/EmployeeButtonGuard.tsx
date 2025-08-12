import React from 'react';
import { Employee } from '../../types';

/**
 * Composant de garde pour les boutons d'employé
 * Permet de contrôler de manière centralisée quels boutons peuvent être affichés selon le type d'employé
 */
export const EmployeeButtonGuard = {
  /**
   * Vérifie si le bouton de suppression peut être affiché pour cet employé
   * @param employee L'employé à vérifier
   * @returns true si le bouton peut être affiché, false sinon
   */
  canShowDeleteButton: (employee: Employee): boolean => {
    // Empêcher la suppression des administrateurs principaux
    if (employee?.isMainAdmin) {
      return false;
    }
    
    // Empêcher la suppression des employés liés à des comptes Firebase (administrateurs système)
    if (employee?.firebaseUid) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Vérifie si le bouton de modification peut être affiché pour cet employé
   * @param employee L'employé à vérifier
   * @returns true si le bouton peut être affiché, false sinon
   */
  canShowEditButton: (employee: Employee): boolean => {
    // Tous les employés peuvent être modifiés pour l'instant
    return true;
  }
};
