import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, MessageSquare, FileText, Users, Settings } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  // Define navigation items based on user role
  const navigationItems = [
    { 
      icon: Home, 
      label: 'Overview', 
      path: user?.user_metadata.role === 'provider' ? '/provider/dashboard' : '/dashboard'
    },
    { 
      icon: Calendar, 
      label: 'Bookings', 
      path: '/bookings'
    },
    { 
      icon: MessageSquare, 
      label: 'Messages', 
      path: '/messages'
    },
    { 
      icon: FileText, 
      label: 'Documents', 
      path: '/documents'
    },
    { 
      icon: Users, 
      label: 'Profile', 
      path: '/profile'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.pathname === item.path
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}