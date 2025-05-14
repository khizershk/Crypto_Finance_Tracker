import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MetaMaskConnect } from '@/components/MetaMaskConnect';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
}

export function Header({ showSidebar, toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    // Check if dark mode was previously enabled
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark;
    }
    return false;
  });

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/transactions':
        return 'Transactions';
      case '/budget':
        return 'Budget';
      case '/reports':
        return 'Reports';
      case '/preferences':
        return 'Preferences';
      case '/notifications':
        return 'Notifications';
      default:
        return 'CryptoTrack';
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    document.documentElement.classList.toggle('dark');
    setDarkMode(newDarkMode);
    // Persist the dark mode preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newDarkMode ? 'dark' : 'light');
    }
  };

  // Initialize dark mode from localStorage on component mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'dark' && !document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
            onClick={toggleSidebar}
          >
            <i className="ri-menu-line text-2xl"></i>
          </Button>
          <h2 className="ml-3 lg:ml-0 text-xl font-semibold">{getPageTitle(location)}</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <MetaMaskConnect />
          
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 focus:outline-none">
            <i className="ri-notification-3-line text-xl"></i>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 hover:text-slate-900 focus:outline-none"
            onClick={toggleDarkMode}
          >
            <i className={`${darkMode ? 'ri-sun-line' : 'ri-moon-line'} text-xl`}></i>
          </Button>
        </div>
      </div>
    </header>
  );
}
