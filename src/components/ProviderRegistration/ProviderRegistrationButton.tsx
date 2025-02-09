import React from 'react';
import { Button } from '../ui/Button';

interface ProviderRegistrationButtonProps {
  onClick: () => void;
}

export function ProviderRegistrationButton({ onClick }: ProviderRegistrationButtonProps) {
  return (
    <div className="mt-16 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Are you a pet care professional?</h2>
      <p className="text-gray-600 mb-6">Join our platform and connect with pet owners in your area</p>
      <Button onClick={onClick} variant="default" size="lg">
        Become a Provider
      </Button>
    </div>
  );
}