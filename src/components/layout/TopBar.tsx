import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, User, Home } from 'lucide-react';

export function TopBar() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 text-gray-400 hover:text-gray-500"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Settings className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}