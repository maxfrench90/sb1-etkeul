import React, { useState } from 'react';
import { Shield, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

export function NDISVerification() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'verified' | 'rejected'
  >('pending');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload NDIS verification document
      const { error: uploadError } = await supabase.storage
        .from('ndis-documents')
        .upload(`${user.id}/verification.pdf`, selectedFile);

      if (uploadError) throw uploadError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ndis_verification_status: 'pending',
          ndis_document_url: `${user.id}/verification.pdf`
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setVerificationStatus('pending');
    } catch (error) {
      console.error('Verification upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Shield className="w-8 h-8 text-emerald-600" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            NDIS Verification
          </h3>
          <p className="text-sm text-gray-500">
            Upload your NDIS verification documents
          </p>
        </div>
      </div>

      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="ndis-upload"
        />
        <label
          htmlFor="ndis-upload"
          className="cursor-pointer"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF up to 10MB
          </p>
        </label>
      </div>

      {verificationStatus === 'pending' && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-sm text-yellow-700">
            Your verification is being reviewed. This may take 1-2 business days.
          </p>
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div className="bg-green-50 p-4 rounded-md">
          <p className="text-sm text-green-700">
            Your NDIS verification has been approved.
          </p>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">
            Your verification was not approved. Please ensure your documents are correct and try again.
          </p>
        </div>
      )}
    </div>
  );
}