import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Budget, BudgetFormData, Transaction, DEFAULT_USER_ID } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTransactions } from '@/hooks/useTransactions';

export function useBudget(userId = DEFAULT_USER_ID) {
  const [notified, setNotified] = useState(false);
  const { transactions } = useTransactions(userId);
  // Fetch budget
  const {
    data: budget,
    isLoading,
    error,
  } = useQuery<Budget>({
    queryKey: ['/api/budget', userId],
  });

  // Create budget
  const createBudget = useMutation({
    mutationFn: async (budgetData: BudgetFormData) => {
      const data = {
        userId,
        amount: budgetData.amount.toString(),
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
      // Create a new object to hold the request payload
      const data: Record<string, any> = {};
  
      // Ensure that the data is formatted correctly before sending the request
      if (budgetData.amount !== undefined) {
        data.amount = budgetData.amount.toString(); // Convert to string
      }
  
      if (budgetData.periodStart !== undefined) {
        data.periodStart = budgetData.periodStart.toISOString(); // Convert to ISO string
      }
  
      if (budgetData.periodEnd !== undefined) {
        data.periodEnd = budgetData.periodEnd.toISOString(); // Convert to ISO string
      }
  
      if (budgetData.currency !== undefined) {
        data.currency = budgetData.currency; // Already a string
      }
  
      // Add userId to the request payload
      data.userId = userId;
  
      // Send PUT request with the updated data
      const response = await apiRequest('PUT', `/api/budget/${id}`, data);
  
      // Return the response JSON
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries for the updated budget data
      queryClient.invalidateQueries({ queryKey: ['/api/budget', userId] });
    },
  });
  
  // Create budget exceeded notification
  const createBudgetExceededNotification = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/notifications', {
        userId,
        message: "⚠️ Budget limit exceeded! You've gone over your spending limit.",
        timestamp: new Date(),
      });
      return response.json();
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}`] });
    }
  });

  // Calculate budget usage
  const calculateBudgetUsage = (transactions: Transaction[] = []) => {
    if (!budget) return { used: 0, total: 0, percentage: 0, remaining: 0 };

    const budgetAmount = Number(budget.amount);
    const spent = transactions.reduce((total, tx) => {
      if (
        tx.type === 'sent' &&
        new Date(tx.timestamp) >= new Date(budget.periodStart) &&
        new Date(tx.timestamp) <= new Date(budget.periodEnd)
      ) {
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

  // Move useEffect outside of calculateBudgetUsage
  useEffect(() => {
    if (!budget) return;

    const budgetAmount = Number(budget.amount);
    const spent = calculateBudgetUsage(transactions as Transaction[]).used;

    if (spent > budgetAmount && !notified) {
      createBudgetExceededNotification.mutate();
      setNotified(true);
    }
  }, [budget, transactions, notified, createBudgetExceededNotification]);

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
