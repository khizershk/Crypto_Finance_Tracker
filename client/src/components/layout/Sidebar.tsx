import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface NavigationItem {
  icon: string;
  label: string;
  path: string;
}

const mainNavItems: NavigationItem[] = [
  { icon: 'ri-dashboard-line', label: 'Dashboard', path: '/' },
  { icon: 'ri-exchange-dollar-line', label: 'Transactions', path: '/transactions' },
  { icon: 'ri-wallet-3-line', label: 'Budget', path: '/budget' },
  { icon: 'ri-file-chart-line', label: 'Reports', path: '/reports' },
];

const settingsNavItems: NavigationItem[] = [
  { icon: 'ri-settings-4-line', label: 'Preferences', path: '/preferences' },
  { icon: 'ri-notification-3-line', label: 'Notifications', path: '/notifications' },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="bg-primary text-white p-2 rounded">
            <i className="ri-bar-chart-box-line text-xl"></i>
          </div>
          <h1 className="text-xl font-bold">CryptoTrack</h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main
        </div>
        
        {mainNavItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a 
              className={cn(
                "flex items-center px-4 py-3", 
                location === item.path 
                  ? "text-primary bg-primary-50 border-r-4 border-primary" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <i className={`${item.icon} mr-3 text-lg`}></i>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Settings
        </div>
        
        {settingsNavItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a 
              className={cn(
                "flex items-center px-4 py-3", 
                location === item.path 
                  ? "text-primary bg-primary-50 border-r-4 border-primary" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <i className={`${item.icon} mr-3 text-lg`}></i>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            <span className="font-medium text-sm">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-slate-500 truncate">john@example.com</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <i className="ri-logout-box-r-line"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
