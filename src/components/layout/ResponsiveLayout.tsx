import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isMobile = !useMediaQuery('md');

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <>
          <TopBar />
          <MobileNav />
          <main className="pt-16 px-4 pb-20">
            {children}
          </main>
        </>
      ) : (
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <TopBar />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}