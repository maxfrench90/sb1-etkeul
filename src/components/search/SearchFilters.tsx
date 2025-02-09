import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { SearchInput } from './SearchInput';
import { LocationInput } from './LocationInput';
import { CategorySelect } from './CategorySelect';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query: string;
  location: string;
  category: string;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput
          value={filters.query}
          onChange={(query) => setFilters({ ...filters, query })}
        />
        <LocationInput
          value={filters.location}
          onChange={(location) => setFilters({ ...filters, location })}
        />
        <CategorySelect
          value={filters.category}
          onChange={(category) => setFilters({ ...filters, category })}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" variant="default">
          Search Services
        </Button>
      </div>
    </form>
  );
}