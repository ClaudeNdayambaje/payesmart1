import React, { ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string | ReactNode;
  message: string | ReactNode;
  confirmText: string | ReactNode;
  cancelText: string | ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'login'; 
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    if (variant === 'login') {
      return {
        overlay: "absolute inset-0 bg-opacity-80 modal-overlay",
        dialog: "modal-dialog rounded-lg max-w-md w-full mx-4 overflow-hidden",
        header: "px-6 py-4 modal-header",
        title: "text-lg font-medium text-white",
        content: "px-6 py-4",
        message: "text-sm text-gray-300",
        footer: "px-6 py-3 modal-footer flex justify-end space-x-3",
        cancelButton: "px-4 py-2 text-sm font-medium bg-[#28292e] hover:bg-[#3a3b40] text-white rounded-md transition-colors shadow-none border-none",
        confirmButton: "px-4 py-2 text-sm font-medium bg-[#F7941D] hover:bg-[#FFA94D] text-white rounded-md transition-colors shadow-none border-none"
      };
    }
    
    return {
      overlay: "absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm",
      dialog: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden",
      header: "px-6 py-4 border-b border-gray-200 dark:border-gray-700",
      title: "text-lg font-medium text-gray-900 dark:text-white",
      content: "px-6 py-4",
      message: "text-sm text-gray-500 dark:text-gray-300",
      footer: "px-6 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3",
      cancelButton: "px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-500 transition-colors",
      confirmButton: "px-4 py-2 text-sm font-medium bg-[#ef4444] hover:bg-[#dc2626] text-white border border-transparent rounded-md shadow-sm transition-colors"
    };
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec effet de flou */}
      <div 
        className={styles.overlay}
        onClick={onCancel}
      ></div>
      
      {/* Boîte de dialogue */}
      <div className={`relative ${styles.dialog} transform transition-all`}>
        {/* En-tête */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        {/* Contenu */}
        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
        </div>
        
        {/* Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
