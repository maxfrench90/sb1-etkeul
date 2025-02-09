import React, { useState, useEffect } from 'react';
import { Filter, Search, SlidersHorizontal, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ExportButton } from '../../components/ExportButton';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { FilterMultiSelect } from '../../components/dashboard/FilterMultiSelect';
import { SavedFilters } from '../../components/dashboard/SavedFilters';
import { PetAnalytics } from '../../components/dashboard/PetAnalytics';
import { AuditTrail } from '../../components/dashboard/AuditTrail';
import { BulkActions } from '../../components/dashboard/BulkActions';
import { ThemeToggle } from '../../components/dashboard/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import type { Pet, PetFilter, SortConfig, VisibleColumns } from '../../types/pet';

const PAGE_SIZE = 10;

export function PetDataDashboard() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PetFilter>({
    species: '',
    status: '',
    ageRange: { min: 0, max: 20 }
  });
  const [sort, setSort] = useState<SortConfig>({
    column: 'name',
    direction: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    name: true,
    species: true,
    age: true,
    status: true,
    owner_name: true,
    created_at: false
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [theme, setTheme] = useTheme();
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const csvHeaders = {
    id: 'Pet ID',
    name: 'Pet Name',
    species: 'Species',
    age: 'Age',
    status: 'Status',
    owner_name: 'Owner Name',
    created_at: 'Registration Date'
  };

  useEffect(() => {
    loadPets();
  }, [filters, currentPage, sort]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    }
  };

  const loadPets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pets')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.species) {
        query = query.eq('species', filters.species);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.ageRange.min > 0) {
        query = query.gte('age', filters.ageRange.min);
      }
      if (filters.ageRange.max < 20) {
        query = query.lte('age', filters.ageRange.max);
      }

      // Apply sorting
      query = query.order(sort.column, {
        ascending: sort.direction === 'asc'
      });

      // Apply pagination
      query = query
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setPets(data || []);
      if (count !== null) setTotalCount(count);

      if (data?.length === 0 && currentPage > 1) {
        setCurrentPage(1);
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Failed to load pets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof Pet) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportComplete = () => {
    setToast({
      type: 'success',
      message: 'Export completed successfully'
    });
  };

  const handleExportError = (error: Error) => {
    setToast({
      type: 'error',
      message: error.message
    });
  };

  const handleBulkActionComplete = () => {
    setSelectedPets([]);
    loadPets();
    setToast({
      type: 'success',
      message: 'Bulk action completed successfully'
    });
  };

  const handleBulkActionError = (error: Error) => {
    setToast({
      type: 'error',
      message: error.message
    });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className={`space-y-6 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pet Data Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle theme={theme} onChange={setTheme} />
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              Analytics
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
              >
                Audit Trail
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="flex items-center gap-2"
              aria-expanded={showColumnSettings}
              aria-label="Column settings"
            >
              <Settings className="w-4 h-4" />
              Columns
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            <ExportButton
              tableName="pets"
              query={{
                filter: {
                  ...(filters.species && { species: filters.species }),
                  ...(filters.status && { status: filters.status }),
                  ...(filters.ageRange.min > 0 && { age: `gte.${filters.ageRange.min}` }),
                  ...(filters.ageRange.max < 20 && { age: `lte.${filters.ageRange.max}` })
                },
                sort: [{ column: sort.column, order: sort.direction }]
              }}
              csvHeaders={Object.fromEntries(
                Object.entries(csvHeaders).filter(([key]) => visibleColumns[key as keyof VisibleColumns])
              )}
              onError={handleExportError}
              onComplete={handleExportComplete}
            />
          </div>
        </div>

        {showAnalytics && <PetAnalytics pets={pets} />}
        {showAuditTrail && isAdmin && <AuditTrail />}

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <SavedFilters
            currentFilters={filters}
            onLoad={setFilters}
          />
        </div>

        {showColumnSettings && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Visible Columns</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => setVisibleColumns(prev => ({
                      ...prev,
                      [key]: !prev[key as keyof VisibleColumns]
                    }))}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{csvHeaders[key]}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {showFilters && (
          <div 
            id="filter-panel"
            className="bg-white p-4 rounded-lg shadow-sm space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
                  Species
                </label>
                <select
                  id="species"
                  value={filters.species}
                  onChange={(e) => setFilters(prev => ({ ...prev, species: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="">All Species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={filters.ageRange.max}
                    value={filters.ageRange.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, min: parseInt(e.target.value) }
                    }))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    aria-label="Minimum age"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min={filters.ageRange.min}
                    max="20"
                    value={filters.ageRange.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, max: parseInt(e.target.value) }
                    }))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    aria-label="Maximum age"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPets.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <BulkActions
              selectedIds={selectedPets}
              onActionComplete={handleBulkActionComplete}
              onError={handleBulkActionError}
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg">No pets found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPets.length === pets.length}
                          onChange={(e) => {
                            setSelectedPets(
                              e.target.checked ? pets.map(p => p.id) : []
                            );
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      {visibleColumns.name && (
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Pet Name
                            {sort.column === 'name' && (
                              sort.direction === 'asc' ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.species && (
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('species')}
                        >
                          <div className="flex items-center gap-1">
                            Species
                            {sort.column === 'species' && (
                              sort.direction === 'asc' ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.age && (
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('age')}
                        >
                          <div className="flex items-center gap-1">
                            Age
                            {sort.column === 'age' && (
                              sort.direction === 'asc' ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {sort.column === 'status' && (
                              sort.direction === 'asc' ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.owner_name && (
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('owner_name')}
                        >
                          <div className="flex items-center gap-1">
                            Owner
                            {sort.column === 'owner_name' && (
                              sort.direction === 'asc' ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {pets.map((pet) => (
                      <tr key={pet.id}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPets.includes(pet.id)}
                            onChange={(e) => {
                              setSelectedPets(prev =>
                                e.target.checked
                                  ? [...prev, pet.id]
                                  : prev.filter(id => id !== pet.id)
                              );
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        {visibleColumns.name && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {pet.name}
                          </td>
                        )}
                        {visibleColumns.species && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {pet.species}
                          </td>
                        )}
                        {visibleColumns.age && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {pet.age}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              pet.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                            }`}>
                              {pet.status}
                            </span>
                          </td>
                        )}
                        {visibleColumns.owner_name && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {pet.owner_name}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * PAGE_SIZE + 1}
                      </span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * PAGE_SIZE, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-900 dark:border-emerald-500 dark:text-emerald-200'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                      <Button
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}