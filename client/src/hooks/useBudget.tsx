import { useQuery, useMutation } from '@tanstack/react-query';
import { Budget, BudgetFormData, DEFAULT_USER_ID } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useBudget(userId = DEFAULT_USER_ID) {
  // Fetch budget
  const {
    data: budget,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/budget', userId],
  });

  // Create budget
  const createBudget = useMutation({
    mutationFn: async (budgetData: BudgetFormData) => {
      const data = {
        userId,
        amount: budgetData.amount,
        periodStart: budgetData.periodStart.toISOString(),
        periodEnd: budgetData.periodEnd.toISOString(),
        currency: budgetData.currency,
      };
      const response = await apiRequest('POST', '/api/budget', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget', userId] });
    },
  });

  // Update budget
  const updateBudget = useMutation({
    mutationFn: async ({ id, budgetData }: { id: number; budgetData: Partial<BudgetFormData> }) => {
      const data: Record<string, any> = {};
      
      if (budgetData.amount !== undefined) {
        data.amount = budgetData.amount;
      }
      
      if (budgetData.periodStart !== undefined) {
        data.periodStart = budgetData.periodStart.toISOString();
      }
      
      if (budgetData.periodEnd !== undefined) {
        data.periodEnd = budgetData.periodEnd.toISOString();
      }
      
      if (budgetData.currency !== undefined) {
        data.currency = budgetData.currency;
      }
      
      const response = await apiRequest('PUT', `/api/budget/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget', userId] });
    },
  });

  // Calculate budget usage
  const calculateBudgetUsage = (transactions = []) => {
    if (!budget) return { used: 0, total: 0, percentage: 0, remaining: 0 };
    
    const budgetAmount = Number(budget.amount);
    const spent = transactions.reduce((total, tx) => {
      if (tx.type === 'sent' &&
          new Date(tx.timestamp) >= new Date(budget.periodStart) &&
          new Date(tx.timestamp) <= new Date(budget.periodEnd)) {
        return total + Number(tx.amount);
      }
      return total;
    }, 0);
    
    const remaining = budgetAmount - spent;
    const percentage = Math.min(Math.round((spent / budgetAmount) * 100), 100);
    
    return {
      used: spent,
      total: budgetAmount,
      percentage,
      remaining,
    };
  };

  // Calculate days remaining in budget period
  const getDaysRemaining = () => {
    if (!budget) return 0;
    
    const now = new Date();
    const endDate = new Date(budget.periodEnd);
    
    // Calculate the difference in days
    const differenceInTime = endDate.getTime() - now.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return Math.max(0, differenceInDays);
  };

  return {
    budget,
    isLoading,
    error,
    createBudget,
    updateBudget,
    calculateBudgetUsage,
    getDaysRemaining,
  };
}
