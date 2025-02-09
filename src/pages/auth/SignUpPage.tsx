import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '../../components/auth/AuthForm';

export function SignUpPage() {
  const [role, setRole] = useState<'client' | 'provider'>('client');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div 
              className="flex justify-center space-x-4"
              role="radiogroup"
              aria-label="Account type"
            >
              <button
                onClick={() => setRole('client')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  role === 'client'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                role="radio"
                aria-checked={role === 'client'}
              >
                Pet Owner
              </button>
              <button
                onClick={() => setRole('provider')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  role === 'provider'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                role="radio"
                aria-checked={role === 'provider'}
              >
                Service Provider
              </button>
            </div>
          </div>

          <AuthForm type="sign-up" role={role} />
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;