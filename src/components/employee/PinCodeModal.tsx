import React, { useState } from 'react';

interface PinCodeModalProps {
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

const PinCodeModal: React.FC<PinCodeModalProps> = ({ onConfirm, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Vérifier que la valeur ne contient que des chiffres
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      if (error && value.length === 4) {
        setError('');
      }
    }
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      onConfirm(pin);
    } else {
      setError('Le code PIN doit comporter 4 chiffres');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-5 w-[320px]">
        <h2 className="text-base font-semibold mb-4 text-center text-primary">Code PIN</h2>
        <input
          type="password"
          id="pin"
          name="pin"
          value={pin}
          onChange={handlePinChange}
          maxLength={4}
          placeholder="••••"
          className="form-input py-2 text-center w-full text-xl rounded-md mb-2"
          required
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 text-center">{error}</p>
        )}
        <p className="text-sm text-gray-500 mt-2 mb-3 text-center">
          Ce code vous servira pour vous connecter à la caisse
        </p>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 text-sm font-medium rounded-md transition-colors w-full"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white py-2 text-sm font-medium rounded-md transition-colors w-full"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinCodeModal;
