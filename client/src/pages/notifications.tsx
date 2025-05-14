import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle } from 'lucide-react';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { DEFAULT_USER_ID } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface Notification {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  timestamp: string;
}

export default function NotificationsPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${DEFAULT_USER_ID}`],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest(
        'PATCH',
        `/api/notifications/${notificationId}/read`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/notifications/${DEFAULT_USER_ID}`],
      });
    },
  });

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return <div>Error loading notifications</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[500px] pr-4">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start justify-between p-4 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead.mutate(notification.id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}