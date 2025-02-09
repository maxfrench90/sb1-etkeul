import React, { useState } from 'react';
import { useRealtimeQuery } from '../hooks/useRealtimeQuery';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Loader, Plus, Trash2 } from 'lucide-react';
import { useMutation } from '../hooks/useMutation';
import type { DataItem } from '../types/data';

export function RealtimeDataList() {
  const [newItemName, setNewItemName] = useState('');

  // Real-time query with caching
  const { data: items, loading, error, refetch } = useRealtimeQuery<DataItem>({
    queryKey: 'items:list',
    table: 'items',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const addItem = useMutation<DataItem, { name: string }>({
    mutationFn: async ({ name }) => {
      const { data, error } = await supabase
        .from('items')
        .insert({ name, status: 'active' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewItemName('');
      refetch();
    }
  });

  const deleteItem = useMutation<void, { id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await addItem.mutate({ name: newItemName.trim() });
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New item name"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <Button
          type="submit"
          disabled={addItem.loading || !newItemName.trim()}
          className="flex items-center gap-2"
        >
          {addItem.loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Item
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {items?.map((item) => (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteItem.mutate({ id: item.id })}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}