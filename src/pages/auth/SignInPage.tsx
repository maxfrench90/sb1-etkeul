import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthForm } from '../../components/auth/AuthForm';

export function SignInPage() {
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname;

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 
          id="sign-in-heading" 
          className="mt-6 text-center text-3xl font-bold text-gray-900"
        >
          Sign in to your account
        </h1>
        {from && (
          <p 
            id="sign-in-description"
            className="mt-2 text-center text-sm text-gray-600"
          >
            Please sign in to access {from}
          </p>
        )}
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/sign-up"
            className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-sm"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div 
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
          aria-labelledby="sign-in-heading"
          aria-describedby={from ? 'sign-in-description' : undefined}
        >
          <AuthForm type="sign-in" />
          <div className="mt-6 text-center">
            <Link
              to="/reset-password"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-sm"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;