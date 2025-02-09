import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileUpload } from './FileUpload';
import { ProviderFormData, FileUploadState } from '../../types/provider';

interface ProviderRegistrationFormProps {
  onClose: () => void;
}

const AVAILABLE_SERVICES = [
  'Dog Walking',
  'Pet Sitting',
  'Pet Grooming',
  'Pet Training',
  'Pet Boarding',
  'Veterinary Services'
];

export function ProviderRegistrationForm({ onClose }: ProviderRegistrationFormProps) {
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    email: '',
    phone: '',
    services: [],
    experience: '',
    about: ''
  });

  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    error: null,
    uploading: false
  });

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFileState({
        file: null,
        error: 'Please upload a valid PDF file (max 5MB)',
        uploading: false
      });
      return;
    }

    setFileState({
      file,
      error: null,
      uploading: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileState.file) {
      setFileState(prev => ({
        ...prev,
        error: 'Police check document is required'
      }));
      return;
    }

    try {
      setFileState(prev => ({ ...prev, uploading: true }));

      // Here you would typically upload the file to your storage service
      // and get back a URL or identifier
      
      const formDataToSubmit = {
        ...formData,
        policeCheck: fileState.file
      };

      console.log('Submitting form data:', formDataToSubmit);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        error: 'Failed to upload file. Please try again.',
        uploading: false
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">Provider Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="tel"
              required
              pattern="[0-9\s\-\+\(\)]*"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., +61 XXX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services Offered
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AVAILABLE_SERVICES.map((service) => (
                <label key={service} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    checked={formData.services.includes(service)}
                    onChange={(e) => {
                      const services = e.target.checked
                        ? [...formData.services, service]
                        : formData.services.filter((s) => s !== service);
                      setFormData({ ...formData, services });
                    }}
                  />
                  <span className="text-sm text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            >
              <option value="">Select experience</option>
              <option value="1-2">1-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>

          <FileUpload state={fileState} onChange={handleFileChange} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About You
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Tell us about your experience with pets, qualifications, and why you'd be a great addition to our platform..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={fileState.uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={fileState.uploading}
            >
              {fileState.uploading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}