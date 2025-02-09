import React, { useState } from 'react';
import { Plus, Trash2, Loader } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';
import { useMutation } from '../hooks/useMutation';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
}

export function TodoList() {
  const [newTodo, setNewTodo] = useState('');

  // Query todos with caching
  const { data: todos, loading, error, refetch } = useQuery<Todo[]>({
    key: 'todos',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });

  // Add todo mutation with optimistic updates
  const addTodo = useMutation<Todo, { title: string }>({
    mutationFn: async ({ title }) => {
      const { data, error } = await supabase
        .from('todos')
        .insert({ title, completed: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    optimisticData: ({ title }) => ({
      id: 'temp-' + Date.now(),
      title,
      completed: false,
      user_id: 'current-user'
    }),
    onSuccess: () => {
      refetch();
      setNewTodo('');
    }
  });

  // Toggle todo mutation with optimistic updates
  const toggleTodo = useMutation<Todo, { id: string; completed: boolean }>({
    mutationFn: async ({ id, completed }) => {
      const { data, error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    optimisticData: ({ id, completed }) => ({
      id,
      completed,
      title: todos?.find(t => t.id === id)?.title || '',
      user_id: 'current-user'
    }),
    onSuccess: () => refetch()
  });

  // Delete todo mutation
  const deleteTodo = useMutation<void, { id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => refetch()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      await addTodo.mutate({ title: newTodo.trim() });
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-md">
        Error loading todos: {error.message}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <Button
          type="submit"
          disabled={addTodo.loading || !newTodo.trim()}
          className="flex items-center gap-2"
        >
          {addTodo.loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {todos?.map((todo) => (
            <li
              key={todo.id}
              className="py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => 
                    toggleTodo.mutate({
                      id: todo.id,
                      completed: !todo.completed
                    })
                  }
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className={`${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {todo.title}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteTodo.mutate({ id: todo.id })}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}