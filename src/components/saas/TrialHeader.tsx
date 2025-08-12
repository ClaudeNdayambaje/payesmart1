import React from 'react';
import TrialPeriodBadge from './TrialPeriodBadge';

interface TrialHeaderProps {
  className?: string;
}

const TrialHeader: React.FC<TrialHeaderProps> = ({ className = '' }) => {
  return (
    <div className={`${className} w-full bg-indigo-50 border-b border-indigo-100 py-2 px-4 flex justify-between items-center`}>
      <div className="text-sm text-indigo-600 font-medium">
        PayeSmart - Version d'essai
      </div>
      <TrialPeriodBadge />
    </div>
  );
};

export default TrialHeader;
