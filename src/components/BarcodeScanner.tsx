import React, { useState, useEffect, useRef } from 'react';
import { setupBarcodeScanner, formatBarcode, isValidBarcode } from '../services/barcodeService';
import { Barcode, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  disabled?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeDetected, disabled = false }) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Configuration du scanner de code-barres
  useEffect(() => {
    if (disabled) return;
    
    const cleanup = setupBarcodeScanner((barcode) => {
      handleBarcodeDetection(barcode);
    });
    
    return cleanup;
  }, [disabled, onBarcodeDetected]);
  
  // Gestion de la détection de code-barres
  const handleBarcodeDetection = (barcode: string) => {
    const formattedBarcode = formatBarcode(barcode);
    
    if (!isValidBarcode(formattedBarcode)) {
      setStatus('error');
      setStatusMessage('Code-barres invalide');
      setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 3000);
      return;
    }
    
    // Afficher le succès
    setStatus('success');
    setStatusMessage('Code-barres détecté');
    setManualBarcode(formattedBarcode);
    
    // Appeler la fonction de callback
    onBarcodeDetected(formattedBarcode);
    
    // Réinitialiser après un délai
    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
      setManualBarcode('');
    }, 2000);
  };
  
  // Gestion de la saisie manuelle
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (manualBarcode.trim() === '') {
      return;
    }
    
    handleBarcodeDetection(manualBarcode);
  };
  
  // Focus sur l'input au chargement
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  return (
    <div className="w-full">
      <form onSubmit={handleManualSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Barcode className="h-5 w-5 text-[color:var(--color-text-secondary)]" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            disabled={disabled}
            placeholder="Scanner ou saisir un code-barres"
            className={`block w-full pl-10 pr-12 py-3 border ${
              status === 'error' 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : status === 'success'
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="submit"
              disabled={disabled || manualBarcode.trim() === ''}
              className="p-2 rounded-r-md text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)] focus:outline-none disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {status !== 'idle' && (
          <div className={`mt-2 flex items-center text-sm ${
            status === 'error' ? 'text-red-600' : 'text-green-600'
          }`}>
            {status === 'error' ? (
              <AlertCircle className="h-4 w-4 mr-1" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            {statusMessage}
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          Scannez un code-barres ou saisissez-le manuellement puis appuyez sur Entrée
        </div>
      </form>
    </div>
  );
};

export default BarcodeScanner;
