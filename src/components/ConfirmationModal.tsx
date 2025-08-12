import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg max-w-md w-full mx-4 overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-center text-gray-800 dark:text-gray-200">{title}</h3>
        </div>
        
        {/* Corps */}
        <div className="px-6 py-4">
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        
        {/* Boutons */}
        <div className="px-6 py-3 flex justify-end gap-2 border-t dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
