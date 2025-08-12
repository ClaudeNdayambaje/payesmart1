import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { VivaTerminal } from '../../types/vivaPaymentsIntegration';
import { Save, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface VivaTerminalFormProps {
  terminal: VivaTerminal | null;
  onSave: (terminal: Partial<VivaTerminal>) => void;
  onCancel: () => void;
}

const VivaTerminalForm: React.FC<VivaTerminalFormProps> = ({
  terminal,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<VivaTerminal>>({
    terminalId: '',
    name: '',
    description: '',
    location: '',
    isActive: true
  });

  useEffect(() => {
    if (terminal) {
      setFormData({
        terminalId: terminal.terminalId,
        name: terminal.name,
        description: terminal.description,
        location: terminal.location,
        isActive: terminal.isActive
      });
    }
  }, [terminal]);

  const handleChange = (field: keyof VivaTerminal, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{terminal ? 'Modifier le terminal' : 'Ajouter un terminal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="terminalId">ID du Terminal <span className="text-red-500">*</span></Label>
              <Input
                id="terminalId"
                value={formData.terminalId || ''}
                onChange={(e) => handleChange('terminalId', e.target.value)}
                placeholder="ID du terminal chez Viva Payments"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nom du Terminal <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom convivial pour identifier le terminal"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Emplacement</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Emplacement physique du terminal (ex: Caisse 1, Étage 2)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description optionnelle du terminal"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
              id="isActive"
            />
            <Label htmlFor="isActive">Terminal actif</Label>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!formData.terminalId || !formData.name}
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VivaTerminalForm;
