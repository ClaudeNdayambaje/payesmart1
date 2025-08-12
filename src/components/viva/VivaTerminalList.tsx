import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { VivaTerminal } from '../../types/vivaPaymentsIntegration';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface VivaTerminalListProps {
  terminals: VivaTerminal[];
  onEdit: (terminal: VivaTerminal) => void;
  onDelete: (terminalId: string) => void;
}

const VivaTerminalList: React.FC<VivaTerminalListProps> = ({
  terminals,
  onEdit,
  onDelete
}) => {
  const [terminalToDelete, setTerminalToDelete] = useState<string | null>(null);

  const handleDeleteClick = (terminalId: string) => {
    setTerminalToDelete(terminalId);
  };

  const confirmDelete = () => {
    if (terminalToDelete) {
      onDelete(terminalToDelete);
      setTerminalToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTerminalToDelete(null);
  };

  return (
    <>
      {terminals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun terminal configuré</CardTitle>
            <CardDescription>
              Ajoutez un terminal pour commencer à recevoir des paiements via Viva Payments.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID du Terminal</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terminals.map(terminal => (
                <TableRow key={terminal.id}>
                  <TableCell className="font-medium">{terminal.terminalId}</TableCell>
                  <TableCell>{terminal.name}</TableCell>
                  <TableCell>{terminal.location || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={terminal.isActive ? 'success' : 'secondary'}>
                      {terminal.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(terminal)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(terminal.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!terminalToDelete} onOpenChange={() => setTerminalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce terminal ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VivaTerminalList;
