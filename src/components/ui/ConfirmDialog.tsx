import React, { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Forcer le rafraîchissement du thème
      const event = new CustomEvent('forceThemeUpdate');
      window.dispatchEvent(event);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;
  
  // Obtenir les couleurs basées sur le type de dialogue
  const getTypeColors = () => {
    switch (type) {
      case 'danger':
        return {
          button: 'var(--theme-color-danger, #ef4444)',
          buttonHover: 'var(--theme-color-danger-dark, #dc2626)',
          icon: '!text-red-500'
        };
      case 'warning':
        return {
          button: 'var(--theme-color-warning, #f59e0b)',
          buttonHover: 'var(--theme-color-warning-dark, #d97706)',
          icon: '!text-amber-500'
        };
      case 'success':
        return {
          button: 'var(--theme-color-success, #10b981)',
          buttonHover: 'var(--theme-color-success-dark, #059669)',
          icon: '!text-green-500'
        };
      case 'info':
      default:
        return {
          button: 'var(--theme-color, #4f46e5)',
          buttonHover: 'var(--theme-color-dark, #4338ca)',
          icon: '!text-blue-500'
        };
    }
  };

  const typeColors = getTypeColors();
  
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${typeColors.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${typeColors.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${typeColors.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${typeColors.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Overlay avec effet de flou */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      ></div>
      
      {/* Boîte de dialogue */}
      <div 
        className={`relative bg-[var(--color-card-bg)] max-w-md w-full mx-4 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}`}
        style={{ 
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div className="px-6 py-5 flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] rounded-md transition-colors transform hover:scale-105 active:scale-100"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white rounded-md transition-all transform hover:scale-105 active:scale-100"
            style={{ 
              backgroundColor: `var(--color-${type})`,
              color: 'var(--color-button-text)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = `var(--color-${type}-dark)`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = `var(--color-${type})`;
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
