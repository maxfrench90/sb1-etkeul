import React from 'react';

export function Hero() {
  return (
    <div className="relative overflow-hidden hero-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find Trusted Pet Care Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with experienced pet care professionals in your area. From dog walking to grooming, we've got your pet care needs covered.
          </p>
        </div>
      </div>
    </div>
  );
}