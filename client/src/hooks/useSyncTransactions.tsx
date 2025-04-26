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
      const transactions = await fetchTransactionHistory();
      console.log('Transactions from MetaMask:', transactions);

      let newTxCount = 0;
      
      // Process each transaction
      console.log('Number of transactions to process:', transactions.length);
      
      if (transactions.length === 0) {
        console.log('No transactions found in MetaMask history');
        toast({
          title: 'No transactions found',
          description: 'No transactions were found in your MetaMask history. Have you made any transactions on this network?',
          variant: 'destructive'
        });
      }
      
      for (const tx of transactions) {
        console.log('Processing transaction:', tx.hash);
        // Check if transaction already exists in our database
        const existingTx = await fetchTransactionByHash(tx.hash);
        console.log('Existing transaction check:', existingTx ? 'Found' : 'Not found');
        
        if (!existingTx) {
          try {
            // Add new transaction to our database
            console.log('Adding transaction to database:', tx);
            const result = await addTransaction.mutateAsync(tx);
            console.log('Transaction added successfully:', result);
            newTxCount++;
          } catch (err) {
            console.error('Error adding transaction:', err);
          }
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