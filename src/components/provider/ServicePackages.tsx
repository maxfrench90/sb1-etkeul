import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Toast } from '../ui/Toast';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
}

export function ServicePackages() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    features: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const packageData = {
        provider_id: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        features: formData.features.filter(f => f.trim())
      };

      const { data, error } = await supabase
        .from('service_packages')
        .upsert(editingPackage ? { id: editingPackage.id, ...packageData } : packageData)
        .select()
        .single();

      if (error) throw error;

      setPackages(prev =>
        editingPackage
          ? prev.map(p => (p.id === editingPackage.id ? data : p))
          : [...prev, data]
      );

      setToast({
        type: 'success',
        message: `Service package ${editingPackage ? 'updated' : 'created'} successfully`
      });

      setShowDialog(false);
      resetForm();
    } catch (err) {
      await errorMonitor.logError({
        operation: 'servicePackage.save',
        error: err instanceof Error ? err.message : 'Failed to save service package',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { formData }
      });

      setToast({
        type: 'error',
        message: 'Failed to save service package'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPackages(prev => prev.filter(p => p.id !== id));
      setToast({
        type: 'success',
        message: 'Service package deleted successfully'
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'servicePackage.delete',
        error: err instanceof Error ? err.message : 'Failed to delete service package',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { packageId: id }
      });

      setToast({
        type: 'error',
        message: 'Failed to delete service package'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      features: ['']
    });
    setEditingPackage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Service Packages</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-lg shadow-sm p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-500">{pkg.duration} minutes</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600">${pkg.price}</p>
            </div>

            <p className="text-gray-600">{pkg.description}</p>

            <ul className="space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingPackage(pkg);
                  setFormData({
                    name: pkg.name,
                    description: pkg.description,
                    price: pkg.price.toString(),
                    duration: pkg.duration.toString(),
                    features: pkg.features
                  });
                  setShowDialog(true);
                }}
                className="flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(pkg.id)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          resetForm();
        }}
        title={`${editingPackage ? 'Edit' : 'Add'} Service Package`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Package Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                required
                min="0"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...formData.features];
                    newFeatures[index] = e.target.value;
                    setFormData({ ...formData, features: newFeatures });
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newFeatures = formData.features.filter((_, i) => i !== index);
                    setFormData({ ...formData, features: newFeatures });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  ...formData,
                  features: [...formData.features, '']
                });
              }}
              className="mt-2"
            >
              Add Feature
            </Button>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingPackage ? 'Update' : 'Create'} Package
            </Button>
          </div>
        </form>
      </Dialog>

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