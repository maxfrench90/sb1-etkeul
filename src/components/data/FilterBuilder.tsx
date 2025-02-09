import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Combobox } from '../ui/Combobox';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: Array<{ value: string; label: string }>;
}

interface FilterCondition {
  field: string;
  operator: string;
  value: string | number | null;
}

interface FilterBuilderProps {
  fields: FilterField[];
  onChange: (conditions: FilterCondition[]) => void;
  className?: string;
}

const OPERATORS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' }
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Does not equal' }
  ]
};

export function FilterBuilder({
  fields,
  onChange,
  className = ''
}: FilterBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: fields[0].key, operator: 'equals', value: null }
    ]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    onChange(newConditions);
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition
    );
    setConditions(newConditions);
    onChange(newConditions);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {conditions.map((condition, index) => {
        const field = fields.find(f => f.key === condition.field);
        if (!field) return null;

        return (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <Combobox
                options={fields.map(f => ({ value: f.key, label: f.label }))}
                value={condition.field}
                onChange={(value) => updateCondition(index, { field: value })}
              />
            </div>
            <div className="flex-1">
              <Combobox
                options={OPERATORS[field.type]}
                value={condition.operator}
                onChange={(value) => updateCondition(index, { operator: value })}
              />
            </div>
            <div className="flex-1">
              {field.type === 'select' ? (
                <Combobox
                  options={field.options || []}
                  value={condition.value as string}
                  onChange={(value) => updateCondition(index, { value })}
                />
              ) : (
                <input
                  type={field.type}
                  value={condition.value || ''}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCondition(index)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Filter
      </Button>
    </div>
  );
}