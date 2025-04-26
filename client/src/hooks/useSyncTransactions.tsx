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
      const response = await fetch(`/api/transactions/${hash}`);
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
      const transactions = await fetchTransactionHistory();
      console.log('Transactions from MetaMask:', transactions);

      let newTxCount = 0;
      
      // Process each transaction
      for (const tx of transactions) {
        // Check if transaction already exists in our database
        const existingTx = await fetchTransactionByHash(tx.hash);
        
        if (!existingTx) {
          // Add new transaction to our database
          await addTransaction.mutateAsync(tx);
          newTxCount++;
        }
      }
      
      toast({
        title: 'Transactions synced',
        description: `${newTxCount} new transactions found and synced from MetaMask`,
        variant: newTxCount > 0 ? 'default' : undefined
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync transactions from MetaMask',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [account, fetchTransactionHistory, addTransaction, fetchTransactionByHash, toast]);

  return {
    syncTransactions,
    isSyncing
  };
}