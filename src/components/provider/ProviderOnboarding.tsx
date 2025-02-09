import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { FileUpload } from '../ProviderRegistration/FileUpload';

export function ProviderOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileState, setFileState] = useState({
    file: null,
    error: null,
    uploading: false
  });

  const handleFileChange = (file: File | null) => {
    setFileState({
      file,
      error: file ? null : 'Please upload a valid PDF file',
      uploading: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fileState.file) {
        throw new Error('Police check document is required');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user');

      // Upload police check
      const filename = `police-check-${user.id}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('police-checks')
        .upload(filename, fileState.file);

      if (uploadError) throw uploadError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('provider_profiles')
        .upsert({
          user_id: user.id,
          police_check_verified: false,
          police_check_file: filename,
          onboarding_completed: true
        });

      if (updateError) throw updateError;

      navigate('/provider/dashboard');
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Complete Your Profile</h2>

        {step === 1 && (
          <div className="space-y-6">
            <FileUpload state={fileState} onChange={handleFileChange} />
            
            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!fileState.file || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-4">Provider Agreement</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>By continuing, you agree to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Maintain professional standards</li>
                  <li>Follow our safety guidelines</li>
                  <li>Complete required background checks</li>
                  <li>Maintain accurate availability</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="agree"
                required
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                I agree to the provider terms and conditions
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}