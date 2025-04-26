import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DEFAULT_USER_ID } from '@/lib/types';

export function MetaMaskConnect() {
  const { isConnected, account, connect, disconnect, fetchTransactionHistory } = useMetaMask();
  const { toast } = useToast();

  // Mutation to save transactions to backend
  const saveTransactions = useMutation({
    mutationFn: async (transactions: any[]) => {
      console.log('Syncing transactions:', transactions);
      
      const promises = transactions.map(tx => {
        // For accurate type determination based on the 'from' address
        const isSent = tx.from.toLowerCase() === account?.toLowerCase();
        
        const transaction = {
          userId: DEFAULT_USER_ID,
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '',
          amount: tx.value.toString(),
          timestamp: tx.timestamp,
          currency: 'ETH',
          category: getCategoryFromAddress(tx.to || ''),
          status: tx.status,
          type: isSent ? 'sent' : 'received',
        };
        
        console.log('Saving transaction:', transaction);
        
        return apiRequest('POST', '/api/transactions', transaction)
          .then(res => res.json())
          .catch(err => {
            console.error('Error saving transaction:', err);
            // Ignore duplicate transaction errors (409)
            if (!(err.message && err.message.includes('409'))) {
              throw err;
            }
          });
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: 'Transactions synchronized',
        description: 'Your transactions have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Synchronization failed',
        description: 'Failed to save transactions. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSync = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your MetaMask wallet first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const transactions = await fetchTransactionHistory();
      if (transactions.length > 0) {
        saveTransactions.mutate(transactions);
      } else {
        toast({
          title: 'No transactions found',
          description: 'No transactions were found for your wallet.',
        });
      }
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      toast({
        title: 'Synchronization failed',
        description: 'Failed to fetch transactions from MetaMask.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to categorize transactions based on known addresses
  const getCategoryFromAddress = (address: string): string => {
    const knownAddresses: Record<string, string> = {
      // Example mapping - in a real app, you would have a more extensive list
      '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b': 'Exchange',
      '0x7f1531b6b88f880761c3c1ec478c11e8211994e2': 'DeFi',
      '0x2f9c9eee7b368a6a90b93103ac1ce2c522f7d254': 'NFTs',
    };
    
    return knownAddresses[address?.toLowerCase()] || 'Other';
  };

  if (isConnected && account) {
    const displayAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
    
    return (
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          className="flex items-center px-3 py-1.5 border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
          onClick={handleSync}
        >
          <i className="ri-refresh-line mr-1.5"></i>
          <span>Sync</span>
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center px-3 py-1.5 border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
          onClick={handleDisconnect}
        >
          <i className="ri-wallet-3-line mr-1.5"></i>
          <span>{displayAddress}</span>
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      className="flex items-center px-3 py-1.5 border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
      onClick={handleConnect}
    >
      <svg className="w-5 h-5 mr-1.5" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09902L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.65857 1L15.6524 10.8511L13.3445 5.0991L2.65857 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28.2295 23.5334L24.7348 28.7993L32.282 30.7954L34.402 23.6517L28.2295 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1.22363 23.6515L3.33339 30.7953L10.8698 28.7992L7.38504 23.5333L1.22363 23.6515Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.4704 14.5149L8.39075 17.6507L15.8516 17.9876L15.6074 9.95601L10.4704 14.5149Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25.1459 14.5151L19.9136 9.82373L19.8242 17.9877L27.2747 17.6509L25.1459 14.5151Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.8704 28.7993L15.3907 26.6414L11.5243 23.7028L10.8704 28.7993Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.2258 26.6414L24.7351 28.7993L24.0919 23.7028L20.2258 26.6414Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Connect Wallet</span>
    </Button>
  );
}
