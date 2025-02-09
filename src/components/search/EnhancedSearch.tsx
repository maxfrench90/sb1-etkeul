import React, { useState } from 'react';
import { Search, MapPin, Filter, Save, Star } from 'lucide-react';
import { useSearch } from './SearchProvider';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { DateRangePicker } from '../ui/DateRangePicker';

export function EnhancedSearch() {
  const {
    filters,
    setFilters,
    results,
    isLoading,
    savedSearches,
    saveSearch,
    loadSearch
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSaveSearch = async () => {
    try {
      await saveSearch(searchName);
      setShowSaveDialog(false);
      setToast({
        type: 'success',
        message: 'Search saved successfully'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Failed to save search'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Search */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter location"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onChange={(e) => {
                // In a real app, use a geocoding service here
                setFilters({
                  ...filters,
                  location: {
                    latitude: 0,
                    longitude: 0,
                    radius: 10
                  }
                });
              }}
            />
          </div>

          {/* Service Type */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={filters.serviceType || ''}
              onChange={(e) => setFilters({
                ...filters,
                serviceType: e.target.value || undefined
              })}
            >
              <option value="">All Services</option>
              <option value="dog-walking">Dog Walking</option>
              <option value="pet-sitting">Pet Sitting</option>
              <option value="grooming">Grooming</option>
              <option value="training">Training</option>
            </select>
          </div>

          {/* Filter Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              onClick={() => setShowSaveDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: {
                      ...filters.priceRange,
                      min: parseInt(e.target.value)
                    }
                  })}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: {
                      ...filters.priceRange,
                      max: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({
                      ...filters,
                      rating: rating === filters.rating ? undefined : rating
                    })}
                    className={`p-2 rounded-md ${
                      filters.rating === rating
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <DateRangePicker
                startDate={filters.availability?.date || null}
                endDate={null}
                onChange={([date]) => setFilters({
                  ...filters,
                  availability: date ? {
                    date,
                    timeSlot: filters.availability?.timeSlot || '09:00'
                  } : undefined
                })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No providers found matching your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                {/* Provider card content */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Search Dialog */}
      <Dialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Save Search"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="search-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Name
            </label>
            <input
              id="search-name"
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Dog Walkers in Sydney"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSearch}
              disabled={!searchName.trim()}
            >
              Save Search
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}