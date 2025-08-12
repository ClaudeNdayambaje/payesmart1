import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Shift } from '../../types';
import { 
  Clock, X, Calendar, CheckCircle, XCircle, AlertTriangle, List, 
  CalendarDays, Plus, Users, Download, BarChart, Search, Sliders, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  isWithinInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../contexts/ThemeContext';

// Définition du type pour les statuts de shift (doit correspondre à celui dans types/index.ts)
type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'absent' | 'late' | 'cancelled' | 'in_progress';

// Définition du type pour les filtres
interface ShiftFilters {
  status: ShiftStatus | 'all';
  employee: string | 'all';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface ShiftManagerProps {
  shifts: Shift[];
  employees: Employee[];
  searchQuery: string;
  onAddShift: (selectedDate?: Date) => void;
  onUpdateShift: (id: string, updates: Partial<Shift>) => void;
  canManage?: boolean;
}

const ShiftManager: React.FC<ShiftManagerProps> = ({
  shifts,
  employees,
  searchQuery,
  onAddShift,
  onUpdateShift,
  canManage = false,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftDetailsModal, setShowShiftDetailsModal] = useState<boolean>(false);
  const [filters, setFilters] = useState<ShiftFilters>({
    status: 'all',
    employee: 'all',
    dateRange: {
      start: null,
      end: null
    }
  });
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    absent: 0,
    cancelled: 0,
    inProgress: 0
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const newStats = {
      total: shifts.length,
      upcoming: shifts.filter(s => s.status === 'scheduled').length,
      completed: shifts.filter(s => s.status === 'completed').length,
      absent: shifts.filter(s => s.status === 'absent').length,
      cancelled: shifts.filter(s => (s.status as ShiftStatus) === 'cancelled').length,
      inProgress: shifts.filter(s => (s.status as ShiftStatus) === 'in_progress').length
    };
    setStats(newStats);
  }, [shifts]);

  // Filtrer les shifts en fonction de la recherche et des filtres
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      if (!employee) return false;

      // Filtrage par recherche
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                           (shift.status as ShiftStatus).toLowerCase().includes(searchQuery.toLowerCase());

      // Filtrage par statut
      const matchesStatus = filters.status === 'all' || (shift.status as ShiftStatus) === filters.status;

      // Filtrage par employé
      const matchesEmployee = filters.employee === 'all' || shift.employeeId === filters.employee;

      // Filtrage par date
      let matchesDate = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const shiftStart = new Date(shift.start);
        const shiftEnd = new Date(shift.end);
        matchesDate = isWithinInterval(shiftStart, {
          start: filters.dateRange.start,
          end: filters.dateRange.end
        }) || isWithinInterval(shiftEnd, {
          start: filters.dateRange.start,
          end: filters.dateRange.end
        });
      }

      return matchesSearch && matchesStatus && matchesEmployee && matchesDate;
    });
  }, [shifts, employees, searchQuery, filters]);

  // Obtenir le nom de l'employé à partir de son ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu';
  };

  // Gérer l'ouverture du modal de détails d'un shift
  const handleOpenShiftDetails = (shift: Shift) => {
    setSelectedShift(shift);
    setShowShiftDetailsModal(true);
  };

  // Gérer la fermeture du modal de détails d'un shift
  const handleCloseShiftDetails = () => {
    setSelectedShift(null);
    setShowShiftDetailsModal(false);
  };

  // Gérer la mise à jour d'un shift
  const handleUpdateShift = (updates: Partial<Shift>) => {
    if (selectedShift) {
      onUpdateShift(selectedShift.id, updates);
      handleCloseShiftDetails();
    }
  };

  // Formater le statut du shift avec des couleurs adaptées au thème
  const formatStatus = (status: ShiftStatus) => {
    const isDarkMode = theme === 'dark' || theme === 'black' || theme === 'navyblue' || theme === 'charcoal';

    switch (status) {
      case 'scheduled':
        return (
          <span className="flex items-center text-blue-600">
            <Calendar size={16} className={`mr-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Planifié</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center">
            <CheckCircle size={16} className={`mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>Terminé</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center">
            <XCircle size={16} className={`mr-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>Annulé</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center">
            <Clock size={16} className={`mr-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={isDarkMode ? 'text-amber-400' : 'text-amber-600'}>En cours</span>
          </span>
        );
      case 'absent':
        return (
          <span className="flex items-center">
            <AlertTriangle size={16} className={`mr-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>Absent</span>
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center">
            <AlertTriangle size={16} className={`mr-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>En retard</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center">
            <AlertTriangle size={16} className={`mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{status}</span>
          </span>
        );
    }
  };

  // Helper pour obtenir la couleur d'arrière-plan des événements du calendrier
  const getShiftBackgroundColor = (status: ShiftStatus) => {
    const isDarkMode = theme === 'dark' || theme === 'black' || theme === 'navyblue' || theme === 'charcoal';

    switch(status) {
      case 'scheduled': 
        return isDarkMode ? 'bg-blue-800/30 border-blue-700' : 'bg-blue-100 border-blue-200';
      case 'active': 
        return isDarkMode ? 'bg-purple-800/30 border-purple-700' : 'bg-purple-100 border-purple-200';
      case 'completed': 
        return isDarkMode ? 'bg-green-800/30 border-green-700' : 'bg-green-100 border-green-200';
      case 'absent': 
        return isDarkMode ? 'bg-red-800/30 border-red-700' : 'bg-red-100 border-red-200';
      case 'late': 
        return isDarkMode ? 'bg-orange-800/30 border-orange-700' : 'bg-orange-100 border-orange-200';
      case 'cancelled': 
        return isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100 border-gray-200';
      case 'in_progress': 
        return isDarkMode ? 'bg-amber-800/30 border-amber-700' : 'bg-amber-100 border-amber-200';
      default: 
        return isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100 border-gray-200';
    }
  };

  // Calculer la durée du shift en heures
  const calculateDuration = (start: Date, end: Date) => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours.toFixed(1);
  };

  // Mettre à jour le statut d'un shift
  const handleStatusChange = (shiftId: string, newStatus: ShiftStatus) => {
    onUpdateShift(shiftId, { status: newStatus as Shift['status'] });
  };

  // Fonction pour exporter les shifts au format CSV
  const exportToCSV = () => {
    // En-têtes du CSV
    const headers = [
      'ID', 'Employé', 'Date début', 'Heure début', 'Date fin', 'Heure fin', 
      'Durée (h)', 'Statut', 'Notes'
    ].join(',');
    
    // Convertir chaque shift en ligne CSV
    const csvRows = filteredShifts.map(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Inconnu';
      const startDate = format(new Date(shift.start), 'dd/MM/yyyy', { locale: fr });
      const startTime = format(new Date(shift.start), 'HH:mm', { locale: fr });
      const endDate = format(new Date(shift.end), 'dd/MM/yyyy', { locale: fr });
      const endTime = format(new Date(shift.end), 'HH:mm', { locale: fr });
      const duration = calculateDuration(shift.start, shift.end);
      
      return [
        shift.id,
        employeeName.replace(/,/g, ' '), // Éviter les problèmes avec les virgules
        startDate,
        startTime,
        endDate,
        endTime,
        duration,
        shift.status,
        (shift.notes || '').replace(/,/g, ' ').replace(/\n/g, ' ') // Nettoyer les notes
      ].join(',');
    });
    
    // Combiner en-têtes et lignes
    const csvContent = [headers, ...csvRows].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Configurer et déclencher le téléchargement
    const fileName = `horaires_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      status: 'all',
      employee: 'all',
      dateRange: {
        start: null,
        end: null
      }
    });
  };

  return (
    <div className="h-full w-full p-6 flex flex-col space-y-6">
      {/* Dashboard avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)]`}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">Total Horaires</div>
            <Users className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{stats.total}</div>
        </div>
        
        <div className={`rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)]`}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">À venir</div>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{stats.upcoming}</div>
        </div>
        
        <div className={`rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)]`}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">En cours</div>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{stats.inProgress}</div>
        </div>
        
        <div className={`rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)]`}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">Terminés</div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{stats.completed}</div>
        </div>
        
        <div className={`rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)]`}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">Absences</div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{stats.absent}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium text-[color:var(--color-text)] flex items-center">
          <Clock className="h-5 w-5 mr-2 text-[color:var(--color-primary)]" />
          <span>{filteredShifts.length} horaire{filteredShifts.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Bouton de filtrage */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-[color:var(--color-bg-muted)] text-[color:var(--color-text)] rounded-lg hover:bg-[color:var(--color-border)] flex items-center gap-2 transition-all duration-200"
            title="Filtrer les horaires"
          >
            <Sliders size={16} />
            Filtres
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {/* Bouton d'exportation */}
          {filteredShifts.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-[color:var(--color-success)] text-white rounded-lg hover:bg-[color:var(--color-success-dark)] flex items-center gap-2 transition-all duration-200 shadow-sm"
              title="Exporter les horaires filtrés au format CSV"
            >
              <Download size={16} />
              Exporter
            </button>
          )}
          
          <div className="flex bg-[color:var(--color-bg-muted)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md flex items-center text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-[color:var(--color-card-bg)] text-[color:var(--color-primary)] shadow-sm' 
                  : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]'
              }`}
            >
              <List className="h-4 w-4 mr-1.5" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md flex items-center text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-[color:var(--color-card-bg)] text-[color:var(--color-primary)] shadow-sm' 
                  : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]'
              }`}
            >
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Calendrier
            </button>
          </div>
          
          {canManage && (
            <button
              onClick={() => onAddShift()}
              className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-lg hover:bg-[color:var(--color-primary-dark)] flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Nouvel horaire
            </button>
          )}
        </div>
      </div>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <div className="bg-[color:var(--color-card-bg)] rounded-xl shadow-sm p-4 border border-[color:var(--color-border)] mb-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[color:var(--color-text)]">Filtres avancés</h3>
            <button 
              onClick={resetFilters}
              className="text-sm text-[color:var(--color-primary)] hover:underline"
            >
              Réinitialiser
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as ShiftStatus | 'all'})}
                className="w-full px-3 py-2 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              >
                <option value="all">Tous les statuts</option>
                <option value="scheduled">Planifié</option>
                <option value="active">Actif</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="absent">Absent</option>
                <option value="late">En retard</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            
            {/* Filtre par employé */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Employé
              </label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({...filters, employee: e.target.value})}
                className="w-full px-3 py-2 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              >
                <option value="all">Tous les employés</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtre par période */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Période
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setFilters({
                      ...filters, 
                      dateRange: {
                        ...filters.dateRange,
                        start: date
                      }
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  placeholder="Date début"
                />
                <input
                  type="date"
                  value={filters.dateRange.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setFilters({
                      ...filters, 
                      dateRange: {
                        ...filters.dateRange,
                        end: date
                      }
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  placeholder="Date fin"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="bg-[color:var(--color-card-bg)] rounded-xl shadow-sm border border-[color:var(--color-border)] overflow-hidden flex-grow">
          {filteredShifts.length > 0 ? (
            <table className="min-w-full divide-y divide-[color:var(--color-border)]">
              <thead>
                <tr className="bg-[color:var(--color-bg-muted)]">
                  <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Début
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Fin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
              {filteredShifts.map((shift, index) => {
                // Déterminer la couleur en fonction du statut
                let statusColor = '';
                const status = shift.status as ShiftStatus;
                switch(status) {
                  case 'scheduled': statusColor = 'bg-blue-50 border-blue-100'; break;
                  case 'active': statusColor = 'bg-purple-50 border-purple-100'; break;
                  case 'completed': statusColor = 'bg-green-50 border-green-100'; break;
                  case 'absent': statusColor = 'bg-gray-50 border-gray-100'; break;
                  case 'late': statusColor = 'bg-orange-50 border-orange-100'; break;
                  case 'cancelled': statusColor = 'bg-red-50 border-red-100'; break;
                  case 'in_progress': statusColor = 'bg-amber-50 border-amber-100'; break;
                  default: statusColor = 'bg-gray-50 border-gray-100';
                }
                
                return (
                  <tr key={shift.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[color:var(--color-bg-muted)]'}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[color:var(--color-text)]">
                        {getEmployeeName(shift.employeeId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[color:var(--color-text)]">
                        {format(new Date(shift.start), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm text-[color:var(--color-text-secondary)]">
                        {format(new Date(shift.start), 'HH:mm', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[color:var(--color-text)]">
                        {format(new Date(shift.end), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm text-[color:var(--color-text-secondary)]">
                        {format(new Date(shift.end), 'HH:mm', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[color:var(--color-bg-muted)] text-[color:var(--color-text)] rounded-full text-sm font-medium">
                        {calculateDuration(shift.start, shift.end)} h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatStatus(shift.status as ShiftStatus)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage && (
                        <select
                          value={shift.status}
                          onChange={(e) => handleStatusChange(shift.id, e.target.value as ShiftStatus)}
                          className={`px-3 py-1.5 border rounded-lg text-sm font-medium ${statusColor}`}
                        >
                          <option value="scheduled">Planifié</option>
                          <option value="active">Actif</option>
                          <option value="in_progress">En cours</option>
                          <option value="completed">Terminé</option>
                          <option value="absent">Absent</option>
                          <option value="late">En retard</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-[color:var(--color-text-secondary)]">
              <Clock className="h-12 w-12 text-[color:var(--color-text-secondary)] mb-4" />
              <p className="text-lg font-medium">Aucun horaire ne correspond à votre recherche</p>
              <p className="text-sm mt-2">Essayez avec d'autres termes ou ajoutez un nouvel horaire</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 mt-4">
          {/* Jours de la semaine */}
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div 
              key={day} 
              className="text-center py-2 font-medium text-sm text-[color:var(--color-text-secondary)]"
            >
              {day}
            </div>
          ))}
          
          {/* Jours du mois */}
          {eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
            end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
          }).map((day) => {
            // Trouver les shifts pour ce jour
            const dayShifts = filteredShifts.filter(shift => 
              isSameDay(new Date(shift.start), day) || 
              isSameDay(new Date(shift.end), day) ||
              (isWithinInterval(day, {
                start: new Date(shift.start),
                end: new Date(shift.end)
              }))
            );
            
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-1 border rounded-lg overflow-hidden flex flex-col relative ${
                  isToday 
                    ? 'border-[color:var(--color-primary)] shadow-sm' 
                    : 'border-[color:var(--color-border)]'
                } ${
                  isCurrentMonth 
                    ? 'bg-[color:var(--color-card-bg)]' 
                    : 'bg-[color:var(--color-bg-muted)] opacity-70'
                }`}
              >
                <div className={`text-right px-1 py-0.5 text-sm ${
                  isToday 
                    ? 'font-bold text-[color:var(--color-primary)]' 
                    : isCurrentMonth 
                      ? 'font-medium text-[color:var(--color-text)]' 
                      : 'text-[color:var(--color-text-secondary)]'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-1 scrollbar-thin">
                  {dayShifts.length > 0 ? (
                    dayShifts.map(shift => {
                      const employee = employees.find(e => e.id === shift.employeeId);
                      const employeeName = employee ? `${employee.firstName.charAt(0)}. ${employee.lastName}` : 'Inconnu';
                      
                      return (
                        <div 
                          key={shift.id} 
                          onClick={() => handleOpenShiftDetails(shift)}
                          className={`px-2 py-1 rounded-md text-xs border cursor-pointer transition-transform hover:scale-[1.02] ${
                            getShiftBackgroundColor(shift.status as ShiftStatus)
                          }`}
                          title={`${getEmployeeName(shift.employeeId)} - ${format(new Date(shift.start), 'HH:mm')} à ${format(new Date(shift.end), 'HH:mm')}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{employeeName}</span>
                            <span>{format(new Date(shift.start), 'HH:mm')}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : isCurrentMonth && canManage ? (
                    <div 
                      className="h-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                      onClick={() => onAddShift(day)}
                    >
                      <div className="w-6 h-6 rounded-full bg-[color:var(--color-bg-muted)] flex items-center justify-center">
                        <Plus size={14} className="text-[color:var(--color-text-secondary)]" />
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {canManage && isCurrentMonth && (
                  <button
                    onClick={() => onAddShift(day)}
                    className="absolute bottom-1 right-1 w-5 h-5 bg-[color:var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[color:var(--color-primary-dark)] transition-colors"
                    title="Ajouter un horaire"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Barre d'outils de navigation du calendrier */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-[color:var(--color-bg-muted)] transition-colors duration-200"
          >
            <ChevronLeft className="h-5 w-5 text-[color:var(--color-text)]" />
          </button>
          
          <h3 className="text-xl font-medium text-[color:var(--color-text)]">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h3>
          
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-[color:var(--color-bg-muted)] transition-colors duration-200"
          >
            <ChevronRight className="h-5 w-5 text-[color:var(--color-text)]" />
          </button>
        </div>
      )}
      
      {/* Modal de détails du shift */}
      {showShiftDetailsModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[color:var(--color-card-bg)] rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-[color:var(--color-border)]">
              <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Détails de l'horaire</h2>
              <button
                className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
                onClick={handleCloseShiftDetails}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Employé
                </label>
                <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                  {getEmployeeName(selectedShift.employeeId)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                    Date de début
                  </label>
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {format(new Date(selectedShift.start), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                    Heure de début
                  </label>
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {format(new Date(selectedShift.start), 'HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                    Date de fin
                  </label>
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {format(new Date(selectedShift.end), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                    Heure de fin
                  </label>
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {format(new Date(selectedShift.end), 'HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Statut
                </label>
                {canManage ? (
                  <select
                    className="w-full p-2 border border-[color:var(--color-border)] rounded-md bg-[color:var(--color-input-bg)] text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                    value={selectedShift.status}
                    onChange={(e) => handleUpdateShift({ status: e.target.value as Shift['status'] })}
                  >
                    <option value="scheduled">Planifié</option>
                    <option value="active">Actif</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="absent">Absent</option>
                    <option value="late">En retard</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                ) : (
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {formatStatus(selectedShift.status as ShiftStatus)}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Notes
                </label>
                {canManage ? (
                  <textarea
                    className="w-full p-2 border border-[color:var(--color-border)] rounded-md bg-[color:var(--color-input-bg)] text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                    rows={3}
                    defaultValue={selectedShift.notes || ''}
                    onChange={(e) => handleUpdateShift({ notes: e.target.value })}
                    placeholder="Ajouter des notes..."
                  ></textarea>
                ) : (
                  <div className="p-2 bg-[color:var(--color-bg-muted)] rounded-md">
                    {selectedShift.notes || 'Aucune note'}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between space-x-2 mt-6">
                {canManage && (
                  <button
                    type="button"
                    className="px-4 py-2 border border-[color:var(--color-red-500)] text-[color:var(--color-red-500)] rounded-md hover:bg-[color:var(--color-red-50)]"
                    onClick={() => handleUpdateShift({ status: 'cancelled' as Shift['status'] })}
                  >
                    Annuler l'horaire
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-md hover:bg-[color:var(--color-primary-dark)]"
                  onClick={handleCloseShiftDetails}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Barre d'outils avancés */}
      <div className="bg-[color:var(--color-card-bg)] rounded-lg shadow-sm p-4 border border-[color:var(--color-border)] mb-6">
        <h2 className="text-lg font-medium text-[color:var(--color-text)] mb-4">Outils avancés</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-md hover:bg-[color:var(--color-primary-dark)] flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-md hover:bg-[color:var(--color-primary-dark)] flex items-center"
          >
            <BarChart className="h-4 w-4 mr-2" />
            Statistiques
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-md hover:bg-[color:var(--color-primary-dark)] flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Recherche
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[color:var(--color-primary)] text-white rounded-md hover:bg-[color:var(--color-primary-dark)] flex items-center"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Paramètres
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;
