import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/hooks/usePreferences';

export default function Preferences() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { preferences, updatePreferences } = usePreferences();
  const { toast } = useToast();
  
  const [darkMode, setDarkMode] = useState(preferences?.theme === 'dark');
  const [notifications, setNotifications] = useState(preferences?.notifications ?? true);
  const [currency, setCurrency] = useState(preferences?.currency ?? 'ETH');

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences.mutateAsync({
        theme: darkMode ? 'dark' : 'light',
        notifications,
        currency
      });
      
      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground dark:text-white mb-6">Preferences</h1>
            
            <div className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground dark:text-white">Display Settings</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-gray-400">
                    Customize how you want the application to look
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground dark:text-gray-200">Dark Mode</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Enable dark mode for the application</p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground dark:text-gray-200">Default Currency</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Select your preferred currency</p>
                    </div>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground dark:text-white">Notification Preferences</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-gray-400">
                    Manage how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground dark:text-gray-200">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}