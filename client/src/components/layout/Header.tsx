import { useState } from 'react';
import { useLocation } from 'wouter';
import { MetaMaskConnect } from '@/components/MetaMaskConnect';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
}

export function Header({ showSidebar, toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const [darkMode, setDarkMode] = useState(false);

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
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <header className="bg-white border-b border-slate-200">
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
