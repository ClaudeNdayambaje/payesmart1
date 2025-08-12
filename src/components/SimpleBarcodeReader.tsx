import React, { useState, useEffect } from 'react';
import { Barcode } from 'lucide-react';
import { Product } from '../types';
import { generateSimpleBarcode } from '../services/barcodeService';

interface SimpleBarcodeReaderProps {
  onBarcodeDetected: (barcode: string) => void;
  products?: Product[];
}

const SimpleBarcodeReader: React.FC<SimpleBarcodeReaderProps> = ({ onBarcodeDetected, products = [] }) => {
  const [barcode, setBarcode] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Gérer la soumission du code-barres
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onBarcodeDetected(barcode.trim());
      setBarcode('');
      setShowSuggestions(false);
    }
  };
  
  // Générer des suggestions de codes-barres basées sur l'entrée de l'utilisateur
  useEffect(() => {
    if (barcode.trim().length > 0 && products.length > 0) {
      // Générer des codes-barres simplifiés pour tous les produits
      const allBarcodes = products.map(product => generateSimpleBarcode(product));
      
      // Filtrer les codes-barres qui correspondent à la saisie de l'utilisateur
      const filteredSuggestions = allBarcodes
        .filter(code => code.toLowerCase().includes(barcode.toLowerCase()))
        .slice(0, 5); // Limiter à 5 suggestions
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [barcode, products]);
  
  // Configurer l'écouteur d'événements pour les scanners de code-barres
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;
    const BARCODE_DELAY = 50; // Délai maximal entre les caractères (en ms)
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = new Date().getTime();
      
      // Si le délai entre les touches est trop long, réinitialiser le buffer
      if (currentTime - lastKeyTime > BARCODE_DELAY && barcodeBuffer.length > 0) {
        barcodeBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      // Ignorer les touches de modification (Shift, Ctrl, Alt, etc.)
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Détecter la touche Entrée (fin de la lecture du code-barres)
      if (event.key === 'Enter' && barcodeBuffer.length > 0) {
        // Traiter le code-barres
        onBarcodeDetected(barcodeBuffer);
        barcodeBuffer = '';
        
        // Empêcher le comportement par défaut de la touche Entrée
        event.preventDefault();
        return;
      }
      
      // Ajouter le caractère au buffer si c'est un caractère imprimable
      if (event.key.length === 1) {
        barcodeBuffer += event.key;
        setIsReading(true);
        
        // Réinitialiser l'indicateur de lecture après un délai
        setTimeout(() => {
          setIsReading(false);
        }, 500);
      }
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('keydown', handleKeyDown);
    
    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBarcodeDetected]);
  
  return (
    <div className="h-full">
      <form onSubmit={handleSubmit} className="flex items-center h-full">
        <div className="relative flex-1 h-full">
          <div className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 ${isReading ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-text-secondary)]'}`}>
            <Barcode size={18} />
          </div>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Code-barres (ex: CAT-123)"
            className="w-full h-full pl-10 pr-10 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)] dark:text-gray-100"
          />
          <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isReading ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
          </div>
          
          {/* Bouton Scanner qui n'apparaît que lorsqu'il y a du contenu */}
          {barcode && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-[color:var(--color-primary)] text-white text-xs rounded hover:bg-[color:var(--color-primary-dark)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-primary-light)] transition-colors duration-200 flex items-center justify-center opacity-70 hover:opacity-100"
            >
              <span>OK</span>
            </button>
          )}
          
          {/* Suggestions de codes-barres */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-150"
                  onClick={() => {
                    setBarcode(suggestion);
                    onBarcodeDetected(suggestion);
                    setBarcode('');
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SimpleBarcodeReader;
