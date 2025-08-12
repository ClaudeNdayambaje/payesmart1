import React from 'react';
import { Employee, EmployeeStats } from '../../types';
import { BarChart2, TrendingUp, Users, Clock, CreditCard, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';

interface EmployeeStatsProps {
  employees: Employee[];
  stats: Record<string, EmployeeStats>;
  searchQuery: string;
}

const EmployeeStatsComponent: React.FC<EmployeeStatsProps> = ({
  employees,
  stats,
  searchQuery,
}) => {
  // Filtrer les employés en fonction de la recherche
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           employee.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculer les statistiques globales
  const totalSales = Object.values(stats).reduce((sum, stat) => sum + (stat.totalSales || 0), 0);
  const totalRevenue = Object.values(stats).reduce((sum, stat) => sum + ((stat as any).totalRevenue || 0), 0);
  const totalHours = Object.values(stats).reduce((sum, stat) => sum + (stat.hoursWorked || 0), 0);
  
  // Calculer la moyenne des ventes par heure
  const averageSalesPerHour = totalHours > 0 ? totalSales / totalHours : 0;
  
  // Calculer la moyenne du panier
  const averageTransactionValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="h-full w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium text-gray-700 flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-indigo-500" />
          <span>Statistiques des employés</span>
        </div>
      </div>
      
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ventes totales</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{totalSales}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full border border-indigo-100">
              <ShoppingCart className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Chiffre d'affaires</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full border border-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Heures travaillées</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{totalHours.toFixed(1)} h</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-full border border-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Indicateurs de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Ventes par heure</h3>
            <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{averageSalesPerHour.toFixed(1)}</p>
          <p className="text-gray-500 text-sm mt-1">transactions par heure en moyenne</p>
        </div>
        
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Panier moyen</h3>
            <div className="p-2 bg-green-50 rounded-full border border-green-100">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{averageTransactionValue.toFixed(2)} €</p>
          <p className="text-gray-500 text-sm mt-1">par transaction</p>
        </div>
      </div>
      
      {/* Classement des employés */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700 dark:text-white">Performance des employés</h3>
            <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Employé
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ventes
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Chiffre d'affaires
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Heures
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ventes/Heure
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmployees.map((employee, index) => {
              const employeeStats = stats[employee.id] || {
                totalSales: 0,
                totalRevenue: 0,
                hoursWorked: 0,
                averageTransactionValue: 0
              } as any;
              
              const salesPerHour = employeeStats.hoursWorked > 0 
                ? employeeStats.totalSales / employeeStats.hoursWorked 
                : 0;
              
              // Déterminer la couleur du rôle
              let roleColor = '';
              switch(employee.role) {
                case 'admin': roleColor = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'; break;
                case 'manager': roleColor = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'; break;
                case 'cashier': roleColor = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'; break;
                default: roleColor = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
              }
              
              return (
                <tr key={employee.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${roleColor}`}>
                        {employee.role === 'admin' ? 'Administrateur' : 
                         employee.role === 'manager' ? 'Gérant' : 'Caissier'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium dark:text-white">{employeeStats.totalSales || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium dark:text-white">{(employeeStats.totalRevenue || 0).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                      {(employeeStats.hoursWorked || 0).toFixed(1)} h
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`mr-2 font-medium ${
                        salesPerHour > averageSalesPerHour ? 'text-green-600 dark:text-green-400' : 
                        salesPerHour < averageSalesPerHour ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {salesPerHour.toFixed(1)}
                      </span>
                      {salesPerHour > averageSalesPerHour && (
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      )}
                      {salesPerHour < averageSalesPerHour && (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Aucun employé ne correspond à votre recherche</p>
            <p className="text-sm mt-2">Essayez avec d'autres termes ou ajoutez un nouvel employé</p>
          </div>
        )}
      </div>
      
      {/* Graphique à venir */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white">Évolution des ventes</h3>
          <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-lg font-medium">Graphique en développement</p>
          <p className="text-sm mt-1">Les statistiques détaillées seront bientôt disponibles</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatsComponent;
