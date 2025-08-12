import React, { useState } from 'react';
import { Employee, Shift, EmployeeStats, Permission, Break } from '../types/index';
import { UserPlus, Users, Clock, BarChart2, Search, Edit, Trash2, CheckCircle, XCircle, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { availablePermissions } from '../config/permissions';

interface EmployeeManagerProps {
  employees: Employee[];
  shifts: Shift[];
  stats: Record<string, EmployeeStats>;
  onAddEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  // La fonctionnalité d'édition des horaires sera implémentée ultérieurement
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  shifts,
  stats,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddShift,
  // onUpdateShift n'est pas utilisé pour le moment
}) => {
  type TabType = 'list' | 'shifts' | 'stats';
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState<Employee | null>(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'cashier' as 'cashier' | 'manager' | 'admin',
    pin: '',
    active: true,
    permissions: [] as Permission[],
    avatarUrl: '',
    businessId: 'default',
  });
  const [newShift, setNewShift] = useState({
    employeeId: '',
    start: new Date(),
    end: new Date(),
    status: 'scheduled' as const,
    breaks: [] as Break[],
    businessId: 'default',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // URLs d'avatars par défaut pour les employés
  const defaultAvatars = [
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg',
    'https://randomuser.me/api/portraits/women/4.jpg',
    'https://randomuser.me/api/portraits/men/5.jpg',
    'https://randomuser.me/api/portraits/women/6.jpg',
    'https://randomuser.me/api/portraits/men/7.jpg',
    'https://randomuser.me/api/portraits/women/8.jpg',
  ];

  const filteredEmployees = employees.filter(
    emp =>
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEmployee = () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.pin) {
      return;
    }

    onAddEmployee(newEmployee);
    setShowAddEmployee(false);
    setNewEmployee({
      firstName: '',
      lastName: '',
      email: '',
      role: 'cashier' as 'cashier' | 'manager' | 'admin',
      pin: '',
      active: true,
      permissions: [],
      avatarUrl: '',
      businessId: 'default',
    });
  };

  const handleUpdateEmployee = () => {
    if (!showEditEmployee) return;

    onUpdateEmployee(showEditEmployee.id, showEditEmployee);
    setShowEditEmployee(null);
  };
  
  // Fonction pour ajouter des avatars par défaut aux employés qui n'en ont pas
  const addDefaultAvatarsToEmployees = () => {
    employees.forEach((employee, index) => {
      if (!employee.avatarUrl) {
        const avatarIndex = index % defaultAvatars.length;
        onUpdateEmployee(employee.id, { avatarUrl: defaultAvatars[avatarIndex] });
      }
    });
  };

  const handleAddShift = () => {
    if (!newShift.employeeId || !newShift.start || !newShift.end) {
      return;
    }

    onAddShift(newShift);
    setShowAddShift(false);
    setNewShift({
      employeeId: '',
      start: new Date(),
      end: new Date(),
      status: 'scheduled',
      breaks: [],
      businessId: 'default',
    });
  };

  const handleTogglePermission = (permission: Permission) => {
    if (showEditEmployee) {
      const hasPermission = showEditEmployee.permissions.some(p => p.id === permission.id);
      const updatedPermissions = hasPermission
        ? showEditEmployee.permissions.filter(p => p.id !== permission.id)
        : [...showEditEmployee.permissions, permission];
      
      setShowEditEmployee({
        ...showEditEmployee,
        permissions: updatedPermissions,
      });
    }
  };
  const renderEmployeeModal = (isEdit: boolean) => {
    const employee = isEdit ? showEditEmployee! : newEmployee;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[color:var(--color-background)] text-[color:var(--color-text)] rounded-lg shadow-xl w-full max-w-xl border border-[color:var(--color-border)]">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {isEdit ? 'Modifier employé' : 'Nouvel employé'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={employee.firstName}
                  onChange={(e) =>
                    isEdit
                      ? setShowEditEmployee({ ...showEditEmployee!, firstName: e.target.value })
                      : setNewEmployee({ ...newEmployee, firstName: e.target.value })
                  }
                  className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={employee.lastName}
                  onChange={(e) =>
                    isEdit
                      ? setShowEditEmployee({ ...showEditEmployee!, lastName: e.target.value })
                      : setNewEmployee({ ...newEmployee, lastName: e.target.value })
                  }
                  className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={employee.email}
                  onChange={(e) =>
                    isEdit
                      ? setShowEditEmployee({ ...showEditEmployee!, email: e.target.value })
                      : setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                  className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  Rôle
                </label>
                <select
                  value={employee.role}
                  onChange={(e) =>
                    isEdit
                      ? setShowEditEmployee({ ...showEditEmployee!, role: e.target.value as 'admin' | 'manager' | 'cashier' })
                      : setNewEmployee({ ...newEmployee, role: e.target.value as 'admin' | 'manager' | 'cashier' })
                  }
                  className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                >
                  <option value="cashier">Caissier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                    Code PIN
                  </label>
                  <input
                    type="password"
                    value={newEmployee.pin}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, pin: e.target.value })
                    }
                    className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  URL de l'avatar
                </label>
                <input
                  type="text"
                  value={employee.avatarUrl || ''}
                  onChange={(e) =>
                    isEdit
                      ? setShowEditEmployee({ ...showEditEmployee!, avatarUrl: e.target.value })
                      : setNewEmployee({ ...newEmployee, avatarUrl: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                  Statut
                </label>
                <div className="flex items-center mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      isEdit
                        ? setShowEditEmployee({ ...showEditEmployee!, active: true })
                        : setNewEmployee({ ...newEmployee, active: true })
                    }
                    className={`flex items-center gap-2 px-3 py-1 rounded-l-lg ${
                      employee.active
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text-secondary)] border border-[color:var(--color-border)]'
                    }`}
                  >
                    <CheckCircle size={16} />
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isEdit
                        ? setShowEditEmployee({ ...showEditEmployee!, active: false })
                        : setNewEmployee({ ...newEmployee, active: false })
                    }
                    className={`flex items-center gap-2 px-3 py-1 rounded-r-lg ${
                      !employee.active
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text-secondary)] border border-[color:var(--color-border)]'
                    }`}
                  >
                    <XCircle size={16} />
                    Inactif
                  </button>
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-[color:var(--color-text)] mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Permissions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <div
                      key={permission.id}
                      onClick={() => handleTogglePermission(permission)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        showEditEmployee?.permissions.some(p => p.id === permission.id)
                          ? 'bg-[color:var(--color-primary)]/20 border border-[color:var(--color-primary)]'
                          : 'bg-[color:var(--color-background-alt)] border border-[color:var(--color-border)]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                          showEditEmployee?.permissions.some(p => p.id === permission.id)
                            ? 'bg-[color:var(--color-primary)]'
                            : 'border border-[color:var(--color-border)]'
                        }`}
                      >
                        {showEditEmployee?.permissions.some(p => p.id === permission.id) && (
                          <CheckCircle size={12} className="text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{permission.name}</div>
                        <div className="text-xs text-[color:var(--color-text-tertiary)]">{permission.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => (isEdit ? setShowEditEmployee(null) : setShowAddEmployee(false))}
                className="px-4 py-2 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={isEdit ? handleUpdateEmployee : handleAddEmployee}
                className="bg-[color:var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-80 transition-opacity"
              >
                {isEdit ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Ajouter des avatars par défaut aux employés qui n'en ont pas
  React.useEffect(() => {
    console.log('Employés actuels:', employees);
    const employeesWithoutAvatars = employees.filter(emp => !emp.avatarUrl);
    console.log('Employés sans avatar:', employeesWithoutAvatars.length);
    if (employeesWithoutAvatars.length > 0) {
      console.log('Ajout d\'avatars par défaut');
      addDefaultAvatarsToEmployees();
    }
  }, [employees]);
  
  // Réinitialiser le mode d'affichage lors du changement d'onglet
  React.useEffect(() => {
    // Par défaut, utiliser la vue en grille pour tous les onglets
    setViewMode('grid');
  }, [activeTab]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[color:var(--color-text)]">Gestion des employés</h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'list' ? 'bg-[color:var(--color-primary)] text-white hover:opacity-80' : 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text)] hover:bg-[color:var(--color-background-alt)]/80'}`}
              >
                <Users size={18} />
                Employés
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'shifts' ? 'bg-[color:var(--color-primary)] text-white hover:opacity-80' : 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text)] hover:bg-[color:var(--color-background-alt)]/80'}`}
              >
                <Clock size={18} />
                Shifts
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'stats' ? 'bg-[color:var(--color-primary)] text-white hover:opacity-80' : 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text)] hover:bg-[color:var(--color-background-alt)]/80'}`}
              >
                <BarChart2 size={18} />
                Statistiques
              </button>
            </div>

            {activeTab === 'list' && (
              <button
                onClick={() => setShowAddEmployee(true)}
                className="bg-[color:var(--color-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <UserPlus size={18} />
                Ajouter employé
              </button>
            )}

            {activeTab === 'shifts' && (
              <button
                onClick={() => setShowAddShift(true)}
                className="bg-[color:var(--color-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Clock size={18} />
                Ajouter shift
              </button>
            )}
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                />
                <Search className="absolute left-3 top-2.5 text-[color:var(--color-text-secondary)]" size={18} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]' : 'text-[color:var(--color-text-tertiary)]'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]' : 'text-[color:var(--color-text-tertiary)]'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className="bg-[color:var(--color-card-bg)] rounded-lg shadow overflow-hidden border border-[color:var(--color-border)]"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {employee.avatarUrl ? (
                            <img src={employee.avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-14 w-14 rounded-full object-cover border-2 border-indigo-200 shadow-sm" />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
                              <User size={28} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[color:var(--color-text)]">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-[color:var(--color-text-secondary)]">{employee.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              employee.active
                                ? 'bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.active ? 'Actif' : 'Inactif'}
                            </span>
                            <span className="text-sm bg-[color:var(--color-background-alt)] text-[color:var(--color-text)] px-2 py-1 rounded-full capitalize">
                              {employee.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowEditEmployee(employee)}
                          className="mt-4 flex-1 bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] py-2 rounded flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          <Edit size={16} />
                          Modifier
                        </button>
                        {!employee.isMainAdmin && (
                          <button
                            onClick={() => onDeleteEmployee(employee.id)}
                            className="mt-4 flex-1 bg-[color:var(--color-error)]/20 text-[color:var(--color-error)] py-2 rounded flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                    {stats[employee.id] && (
                      <div className="bg-[color:var(--color-background-alt)] px-4 py-3 border-t border-[color:var(--color-border)]">
                        <div className="flex justify-between text-sm">
                          <span className="text-[color:var(--color-text-secondary)]">Ventes totales</span>
                          <span className="font-medium">
                            {stats[employee.id].totalSales.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[color:var(--color-text-secondary)]">Transactions</span>
                          <span className="font-medium">
                            {stats[employee.id].totalTransactions}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[color:var(--color-card-bg)] rounded-lg shadow overflow-hidden border border-[color:var(--color-border)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[color:var(--color-background-alt)]">
                      <th className="px-4 py-2 text-left">Avatar</th>
                      <th className="px-4 py-2 text-left">Employé</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Rôle</th>
                      <th className="px-4 py-2 text-center">Statut</th>
                      <th className="px-4 py-2 text-right">Ventes</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(employee => (
                      <tr key={employee.id} className="border-t border-[color:var(--color-border)]">
                        <td className="px-4 py-3">
                          {employee.avatarUrl ? (
                            <img src={employee.avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200 shadow-sm" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
                              <User size={20} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[color:var(--color-text)]">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{employee.email}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize">{employee.role}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.active
                                ? 'bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {stats[employee.id] ? (
                            <span className="font-medium">
                              {stats[employee.id].totalSales.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-[color:var(--color-text-secondary)]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setShowEditEmployee(employee)}
                              className="p-1 text-[color:var(--color-primary)] hover:opacity-80 transition-opacity"
                            >
                              <Edit size={18} />
                            </button>
                            {!employee.isMainAdmin && (
                              <button
                                onClick={() => onDeleteEmployee(employee.id)}
                                className="p-1 text-[color:var(--color-error)] hover:opacity-80 transition-opacity"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[color:var(--color-background-alt)]">
                    <th className="px-4 py-2 text-left">Avatar</th>
                    <th className="px-4 py-2 text-left">Employé</th>
                    <th className="px-4 py-2 text-left">Début</th>
                    <th className="px-4 py-2 text-left">Fin</th>
                    <th className="px-4 py-2 text-center">Statut</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => {
                    const employee = employees.find(e => e.id === shift.employeeId);
                    return (
                      <tr key={shift.id} className="border-t border-[color:var(--color-border)]">
                        <td className="px-4 py-3">
                          {employee ? (
                            <div className="flex items-center justify-center">
                              <div className="flex-shrink-0">
                                {employee.avatarUrl ? (
                                  <img src={employee.avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200 shadow-sm" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
                                    <User size={20} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[color:var(--color-text-secondary)]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {employee ? (
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                          ) : (
                            <span className="text-[color:var(--color-text-secondary)]">Employé inconnu</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {format(new Date(shift.start), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          {format(new Date(shift.end), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              shift.status === 'scheduled'
                                ? 'bg-[color:var(--color-info)]/20 text-[color:var(--color-info)]'
                                : shift.status === 'active'
                                ? 'bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]'
                                : shift.status === 'completed'
                                ? 'bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]'
                                : shift.status === 'absent'
                                ? 'bg-[color:var(--color-error)]/20 text-[color:var(--color-error)]'
                                : 'bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]'
                            }`}
                          >
                            {shift.status === 'scheduled'
                              ? 'Planifié'
                              : shift.status === 'active'
                              ? 'En cours'
                              : shift.status === 'completed'
                              ? 'Terminé'
                              : shift.status === 'absent'
                              ? 'Absent'
                              : 'En retard'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                // Cette fonctionnalité sera implémentée plus tard
                                // quand onUpdateShift sera utilisé
                                alert('Fonctionnalité d\'édition d\'horaire à venir');
                              }}
                              className="p-1 text-[color:var(--color-primary)] hover:opacity-80 transition-opacity"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]' : 'text-[color:var(--color-text-tertiary)]'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]' : 'text-[color:var(--color-text-tertiary)]'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.map(employee => {
                  const employeeStats = stats[employee.id] || {
                    totalSales: 0,
                    averageTransactionValue: 0,
                    totalTransactions: 0,
                    hoursWorked: 0,
                    performance: 0,
                    salesByCategory: {},
                    salesByHour: {},
                    absenceRate: 0,
                    lateArrivals: 0,
                    overtime: 0,
                  };
                  
                  return (
                    <div key={employee.id} className="bg-[color:var(--color-card-bg)] rounded-lg shadow overflow-hidden border border-[color:var(--color-border)]">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-shrink-0">
                            {employee.avatarUrl ? (
                              <img src={employee.avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-14 w-14 rounded-full object-cover border-2 border-indigo-200 shadow-sm" />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
                                <User size={28} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-[color:var(--color-text)]">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-[color:var(--color-text-secondary)] capitalize">{employee.role}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[color:var(--color-text-secondary)]">Ventes totales</span>
                            <span className="font-medium">
                              {employeeStats.totalSales.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[color:var(--color-text-secondary)]">Moyenne par transaction</span>
                            <span className="font-medium">
                              {employeeStats.averageTransactionValue.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[color:var(--color-text-secondary)]">Transactions</span>
                            <span className="font-medium">
                              {employeeStats.totalTransactions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[color:var(--color-text-secondary)]">Heures travaillées</span>
                            <span className="font-medium">
                              {employeeStats.hoursWorked}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[color:var(--color-text-secondary)]">Performance</span>
                            <span className="font-medium">
                              {employeeStats.performance.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[color:var(--color-card-bg)] rounded-lg shadow overflow-hidden border border-[color:var(--color-border)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[color:var(--color-background-alt)]">
                      <th className="px-4 py-2 text-left">Avatar</th>
                      <th className="px-4 py-2 text-left">Employé</th>
                      <th className="px-4 py-2 text-left">Rôle</th>
                      <th className="px-4 py-2 text-center">Ventes</th>
                      <th className="px-4 py-2 text-center">Moyenne</th>
                      <th className="px-4 py-2 text-center">Transactions</th>
                      <th className="px-4 py-2 text-center">Heures</th>
                      <th className="px-4 py-2 text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => {
                      const employeeStats = stats[employee.id] || {
                        totalSales: 0,
                        averageTransactionValue: 0,
                        totalTransactions: 0,
                        hoursWorked: 0,
                        performance: 0,
                        salesByCategory: {},
                        salesByHour: {},
                        absenceRate: 0,
                        lateArrivals: 0,
                        overtime: 0,
                      };
                      
                      return (
                        <tr key={employee.id} className="border-t border-[color:var(--color-border)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <div className="flex-shrink-0">
                                {employee.avatarUrl ? (
                                  <img src={employee.avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-10 w-10 rounded-full object-cover border-2 border-[color:var(--color-primary)] shadow-sm" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-primary)]/70 flex items-center justify-center text-white shadow-sm border border-[color:var(--color-primary)]">
                                    <User size={20} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[color:var(--color-text)]">
                              {employee.firstName} {employee.lastName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize">{employee.role}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employeeStats.totalSales.toFixed(2)} €</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employeeStats.averageTransactionValue.toFixed(2)} €</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employeeStats.totalTransactions}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employeeStats.hoursWorked}h</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employeeStats.performance.toFixed(1)}/10</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showAddEmployee && renderEmployeeModal(false)}
        {showEditEmployee && renderEmployeeModal(true)}

        {showAddShift && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[color:var(--color-background)] text-[color:var(--color-text)] rounded-lg shadow-xl w-full max-w-md border border-[color:var(--color-border)]">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Nouveau shift</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                      Employé
                    </label>
                    <select
                      value={newShift.employeeId}
                      onChange={(e) =>
                        setNewShift({ ...newShift, employeeId: e.target.value })
                      }
                      className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                    >
                      <option value="">Sélectionner un employé</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                      Début
                    </label>
                    <input
                      type="datetime-local"
                      value={format(newShift.start, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) =>
                        setNewShift({ ...newShift, start: new Date(e.target.value) })
                      }
                      className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1">
                      Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={format(newShift.end, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) =>
                        setNewShift({ ...newShift, end: new Date(e.target.value) })
                      }
                      className="w-full border border-[color:var(--color-border)] rounded-lg px-3 py-2 bg-[color:var(--color-background-alt)] text-[color:var(--color-text)]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddShift(false)}
                    className="px-4 py-2 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddShift}
                    className="bg-[color:var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManager;
