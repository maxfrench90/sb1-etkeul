import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Heart, Bell, UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <PawPrint className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Pet Pathways
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Client Dashboard
            </Link>
            <Link to="/provider/dashboard" className="text-gray-600 hover:text-gray-900">
              Provider Dashboard
            </Link>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <UserCircle className="w-5 h-5" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}