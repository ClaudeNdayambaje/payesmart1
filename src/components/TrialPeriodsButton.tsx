import React from 'react';
import { Clock } from 'lucide-react';

interface TrialPeriodsButtonProps {
  className?: string;
}

const TrialPeriodsButton: React.FC<TrialPeriodsButtonProps> = ({ className = '' }) => {
  const navigateToTrialPeriods = () => {
    // Utiliser le HashRouter pour la navigation
    window.location.href = '/#/admin/trial-periods';
  };

  return (
    <button
      onClick={navigateToTrialPeriods}
      className={`bg-[color:var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors flex items-center gap-2 ${className}`}
      title="Gérer les périodes d'essai"
    >
      <Clock size={18} />
      <span>Périodes d'essai</span>
    </button>
  );
};

export default TrialPeriodsButton;
