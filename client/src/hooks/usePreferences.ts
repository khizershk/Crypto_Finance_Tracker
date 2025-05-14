import { useQuery, useMutation } from '@tanstack/react-query';
import { DEFAULT_USER_ID } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface UserPreferences {
  currency: string;
  notifications: boolean;
  theme: 'light' | 'dark';
}

export function usePreferences(userId = DEFAULT_USER_ID) {
  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<UserPreferences>({
    queryKey: [`/api/users/${userId}/preferences`],
  });

  // Update user preferences
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const response = await apiRequest(
        'PATCH',
        `/api/users/${userId}/preferences`,
        newPreferences
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate preferences query to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/preferences`] });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
  };
}