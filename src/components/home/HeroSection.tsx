import React from 'react';
import { Search, MapPin, PawPrint } from 'lucide-react';
import { LocationSearch } from './LocationSearch';
import { ServiceTypeSelect } from './ServiceTypeSelect';

export function HeroSection() {
  return (
    <div className="relative bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80"
          alt="Pet care background"
          className="w-full h-full object-cover opacity-10"
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <PawPrint className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-6">
            Pet Pathways
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with experienced pet care professionals in your area
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <LocationSearch />
              <ServiceTypeSelect />
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}