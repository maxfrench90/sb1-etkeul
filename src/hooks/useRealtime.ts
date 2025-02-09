import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Tables = keyof Database['public']['Tables'];
type Row<T extends Tables> = Database['public']['Tables'][T]['Row'];

interface UseRealtimeOptions<T extends Tables> {
  table: T;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  userId?: string;
}

export function useRealtime<T extends Tables>({ 
  table, 
  event = '*', 
  filter,
  userId 
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<Row<T>[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Initial data fetch with RLS
        let query = supabase.from(table).select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setData(initialData || []);

        // Set up realtime subscription
        channel = supabase.channel(`public:${table}`)
          .on('postgres_changes', {
            event,
            schema: 'public',
            table,
            ...(filter && { filter }),
            ...(userId && { filter: `user_id=eq.${userId}` })
          }, (payload) => {
            setData(currentData => {
              switch (payload.eventType) {
                case 'INSERT':
                  return [...currentData, payload.new as Row<T>];
                case 'UPDATE':
                  return currentData.map(item => 
                    item.id === payload.new.id ? payload.new : item
                  );
                case 'DELETE':
                  return currentData.filter(item => 
                    item.id !== payload.old.id
                  );
                default:
                  return currentData;
              }
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Subscribed to ${table} changes`);
            }
          });

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to setup realtime subscription'));
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log(`Unsubscribing from ${table} changes`);
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, filter, userId]);

  return { data, error };
}
</boltArtifact>
```

4. Finally, let's add a component to demonstrate the real-time functionality:

```typescript
<boltArtifact id="realtime-demo" title="Create real-time demo component">
<boltAction type="file" filePath="src/components/RealtimeDemo.tsx">
import React, { useState } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { AlertCircle, Plus } from 'lucide-react';
import type { DataItem } from '../types/data';

export function RealtimeDemo() {
  const { user } = useAuth();
  const { data, error } = useRealtime<'items'>({
    table: 'items',
    userId: user?.id
  });

  const [adding, setAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !user) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('items')
        .insert({
          name: newItemName.trim(),
          status: 'active',
          user_id: user.id
        });

      if (error) throw error;
      setNewItemName('');
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          status: currentStatus === 'active' ? 'inactive' : 'active'
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New item name"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <Button
            type="submit"
            disabled={adding || !newItemName.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading data</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {data.map((item) => (
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusToggle(item.id, item.status)}
                className={item.status === 'active' ? 'text-green-600' : 'text-gray-600'}
              >
                {item.status === 'active' ? 'Active' : 'Inactive'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}