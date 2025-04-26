import { useState, useCallback } from 'react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useSyncTransactions(userId = 1) {
  const { account, fetchTransactionHistory } = useMetaMask();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Add new transaction to the database
  const addTransaction = useMutation({
    mutationFn: async (transaction: any) => {
      const response = await apiRequest('POST', '/api/transactions', {
        userId,
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.value,
        timestamp: transaction.timestamp,
        currency: 'ETH',
        category: 'Crypto', // Default category, can be changed by user later
        status: transaction.status,
        type: transaction.type,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate transactions queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/categorized-transactions', userId] });
    },
  });

  // Fetch a transaction by hash from the database
  const fetchTransactionByHash = useCallback(async (hash: string) => {
    try {
      const response = await fetch(`/api/transactions/hash/${hash}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction by hash:', error);
      return null;
    }
  }, []);

  // Sync transactions from MetaMask
  const syncTransactions = useCallback(async () => {
    if (!account) {
      toast({
        title: 'Connect MetaMask',
        description: 'Please connect your MetaMask wallet first',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch transactions from MetaMask/Etherscan
      console.log('Fetching transaction history from wallet...');
      const transactions = await fetchTransactionHistory();
      console.log('Transactions from MetaMask:', transactions);

      if (transactions.length === 0) {
        console.log('No transactions found in MetaMask history');
        toast({
          title: 'No transactions found',
          description: 'No transactions were found in your MetaMask history. Have you made any transactions on this network?',
          variant: 'destructive'
        });
        setIsSyncing(false);
        return;
      }
      
      console.log(`Found ${transactions.length} transactions to sync`);
      
      // Use the server-side sync endpoint to process transactions in bulk
      const syncResponse = await fetch('/api/sync-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          userId
        }),
      });
      
      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        console.error('Sync API error:', errorData);
        throw new Error(errorData.message || 'Failed to sync transactions');
      }
      
      const syncResult = await syncResponse.json();
      console.log('Sync result:', syncResult);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categorized-transactions'] });
      
      // Show success message
      toast({
        title: 'Transactions synced',
        description: syncResult.message || `${syncResult.transactions?.length || 0} new transactions synced`,
        variant: (syncResult.transactions?.length || 0) > 0 ? 'default' : undefined
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync transactions from MetaMask',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [account, fetchTransactionHistory, toast, userId, queryClient]);

  return {
    syncTransactions,
    isSyncing
  };
}