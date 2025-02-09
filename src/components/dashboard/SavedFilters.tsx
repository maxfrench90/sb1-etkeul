import React, { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import type { PetFilter } from '../../types/pet';

interface SavedFiltersProps {
  currentFilters: PetFilter;
  onLoad: (filters: PetFilter) => void;
}

export function SavedFilters({ currentFilters, onLoad }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<Array<{
    id: string;
    name: string;
    filters: PetFilter;
  }>>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setSavedFilters(data);
    }
  };

  const handleSave = async () => {
    if (!newFilterName.trim()) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          name: newFilterName.trim(),
          filters: currentFilters
        });

      if (error) throw error;

      setNewFilterName('');
      await loadSavedFilters();
    } catch (err) {
      console.error('Failed to save filter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadSavedFilters();
    } catch (err) {
      console.error('Failed to delete filter:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newFilterName}
          onChange={(e) => setNewFilterName(e.target.value)}
          placeholder="Filter name"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <Button
          onClick={handleSave}
          disabled={loading || !newFilterName.trim()}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Current
        </Button>
      </div>

      {savedFilters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Saved Filters</h3>
          <div className="space-y-2">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200"
              >
                <button
                  onClick={() => onLoad(filter.filters)}
                  className="text-sm text-gray-700 hover:text-emerald-600"
                >
                  {filter.name}
                </button>
                <button
                  onClick={() => handleDelete(filter.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}