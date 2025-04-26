import { useQuery, useMutation } from '@tanstack/react-query';
import { Transaction, DEFAULT_USER_ID } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useTransactions(userId = DEFAULT_USER_ID) {
  // Fetch all transactions
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/transactions', userId],
  });

  // Fetch categorized transactions
  const { 
    data: categorizedTransactions 
  } = useQuery({
    queryKey: ['/api/categorized-transactions', userId],
  });

  // Add a new transaction
  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      const response = await apiRequest('POST', '/api/transactions', transaction);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate transactions queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/categorized-transactions', userId] });
    },
  });

  // Calculate daily spending for charts
  const getDailySpending = (days = 7) => {
    if (!transactions) return [];

    const now = new Date();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      
      // Filter transactions for this day
      const dayTransactions = (transactions as Transaction[]).filter(tx => {
        const txDate = new Date(tx.timestamp).toISOString().split('T')[0];
        return txDate === dayStr && tx.type === 'sent';
      });
      
      // Sum up the amount for this day
      const amount = dayTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      result.push({
        day: getWeekdayName(date),
        amount,
      });
    }

    return result;
  };

  // Get spending by category for charts
  const getSpendingByCategory = () => {
    if (!categorizedTransactions) return [];

    const categories = Object.keys(categorizedTransactions);
    const colors = [
      '#6366f1', // primary
      '#818cf8', // indigo-400
      '#a5b4fc', // indigo-300
      '#f59e0b', // amber-500
    ];

    return categories.map((category, index) => {
      const categoryTransactions = (categorizedTransactions as Record<string, Transaction[]>)[category];
      const value = categoryTransactions.reduce((sum, tx) => {
        return tx.type === 'sent' ? sum + Number(tx.amount) : sum;
      }, 0);

      return {
        name: category,
        value,
        color: colors[index % colors.length],
      };
    });
  };

  // Helper to get weekday name
  const getWeekdayName = (date: Date) => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  };

  return {
    transactions,
    categorizedTransactions,
    isLoading,
    error,
    addTransaction,
    getDailySpending,
    getSpendingByCategory,
  };
}
