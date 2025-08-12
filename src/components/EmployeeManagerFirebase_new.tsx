import React, { useState, useEffect, useContext } from 'react';
import { UserPlus, Search, Loader2, AlertTriangle, Edit, Trash2, UserCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { showConfirmDialog, showAlert } from '../utils/dialogUtils';
import { AppContext } from '../App';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
}

const EmployeeManagerFirebase: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Récupérer l'employé actuel depuis le contexte
  const { currentEmployee } = useContext(AppContext);
  
  // Vérifier si l'utilisateur a les permissions nécessaires
  const canAddEmployees = !!currentEmployee && ['admin', 'manager'].includes(currentEmployee.role);
  const canDeleteEmployees = !!currentEmployee && currentEmployee.role === 'admin';
  
  // Charger les employés au chargement du composant
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const employeesCollection = collection(db, 'employees');
        const employeeSnapshot = await getDocs(employeesCollection);
        const employeesList: Employee[] = employeeSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            role: data.role || 'employee',
            phone: data.phone || ''
          };
        });
        
        setEmployees(employeesList);
        setLoading(false);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des employés:', err);
        setError(`Erreur lors du chargement des données: ${err.message || 'Erreur inconnue'}`);
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Fonction pour supprimer un employé
  const handleDeleteEmployee = async (id: string) => {
    const employeeToDelete = employees.find(e => e.id === id);
    if (!employeeToDelete) return;

    try {
      // Demander confirmation avant la suppression
      const confirmed = await showConfirmDialog(
        `Êtes-vous sûr de vouloir supprimer l'employé ${employeeToDelete.firstName} ${employeeToDelete.lastName} ?`,
        'Suppression d\'employé',
        'Supprimer',
        'Annuler',
        'danger'
      );

      if (!confirmed) return;

      setLoading(true);
      
      // Supprimer l'employé de Firestore
      const employeeRef = doc(db, 'employees', id);
      await deleteDoc(employeeRef);
      
      // Mettre à jour l'état local
      setEmployees(employees.filter(e => e.id !== id));
      showAlert('Employé supprimé avec succès', 'success');
      setLoading(false);
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'employé:', err);
      showAlert(`Erreur lors de la suppression de l'employé: ${err.message || 'Erreur inconnue'}`, 'error');
      setLoading(false);
    }
  };

  // Filtrer les employés en fonction de la recherche
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center p-4 mb-4 text-red-800 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Afficher un indicateur de chargement si nécessaire
  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col h-full w-full min-h-screen bg-[color:var(--color-bg)]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p>Chargement des employés...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Gestion des employés</h2>
      
      {/* Barre de recherche et bouton d'ajout */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {canAddEmployees && (
          <button
            onClick={() => showAlert('Fonctionnalité d\'ajout en cours de développement', 'info')}
            className="flex items-center gap-1 px-3 py-2 border rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            <UserPlus size={18} />
            <span>Ajouter un employé</span>
          </button>
        )}
      </div>

      {/* Liste des employés */}
      <div className="mt-4">
        <h3 className="font-semibold text-lg mb-2">Liste des employés</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Nom</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Rôle</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border p-2 text-center text-gray-500">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="border p-2">{employee.email}</td>
                    <td className="border p-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                        employee.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {employee.role === 'admin' ? 'Administrateur' :
                         employee.role === 'manager' ? 'Manager' :
                         employee.role === 'cashier' ? 'Caissier' : employee.role}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => showAlert('Fonctionnalité de modification en cours de développement', 'info')}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        {canDeleteEmployees && employee.id !== currentEmployee?.id && (
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {employee.id === currentEmployee?.id && (
                          <span className="p-1 text-green-600" title="Vous êtes connecté avec ce compte">
                            <UserCheck size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note informative */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Ce module est en cours de finalisation. Certaines fonctionnalités comme l'ajout et la modification d'employés seront disponibles prochainement.
        </p>
      </div>
    </div>
  );
};

export default EmployeeManagerFirebase;
