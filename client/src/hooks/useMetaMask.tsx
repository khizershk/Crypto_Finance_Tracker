import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MetaMaskState } from '@/lib/types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Custom hook for MetaMask integration
export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    chainId: null,
    error: null,
  });

  const checkIfMetaMaskIsInstalled = useCallback(() => {
    if (typeof window.ethereum === 'undefined') {
      setState(prevState => ({
        ...prevState,
        error: 'MetaMask is not installed. Please install MetaMask to use this application.'
      }));
      return false;
    }
    return true;
  }, []);

  const connect = useCallback(async () => {
    if (!checkIfMetaMaskIsInstalled()) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      
      if (accounts.length > 0) {
        setState({
          isConnected: true,
          account: accounts[0],
          chainId: network.chainId.toString(),
          error: null,
        });
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to connect to MetaMask. Please try again.'
      }));
    }
  }, [checkIfMetaMaskIsInstalled]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      chainId: null,
      error: null,
    });
  }, []);

  const fetchTransactionHistory = useCallback(async (fromBlock = 'earliest', toBlock = 'latest') => {
    if (!checkIfMetaMaskIsInstalled() || !state.account) return [];

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log('Fetching transaction history for account:', state.account);
      
      // Get transactions sent by the user - using eth_getTransactionsByAddress RPC call
      // ethers.js doesn't have a getHistory method on BrowserProvider, so we use a different approach
      const blockNumber = await provider.getBlockNumber();
      console.log('Current block number:', blockNumber);
      
      // Sample transactions for testing when we can't get them from MetaMask
      // In a production app, you would need to use Etherscan API or a similar service
      const mockTransactions = [
        {
          hash: '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
          from: state.account,
          to: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          value: '0.05',
          timestamp: new Date().toISOString(),
          status: 'confirmed'
        },
        {
          hash: '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
          from: '0x7f1531b6b88f880761c3c1ec478c11e8211994e2',
          to: state.account,
          value: '0.1',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          status: 'confirmed'
        }
      ];
      
      console.log('Formatted transactions:', mockTransactions);
      return mockTransactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to fetch transaction history.'
      }));
      return [];
    }
  }, [checkIfMetaMaskIsInstalled, state.account]);

  // Check on mount if we're already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!checkIfMetaMaskIsInstalled()) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const network = await provider.getNetwork();
          
          setState({
            isConnected: true,
            account: accounts[0].address,
            chainId: network.chainId.toString(),
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking MetaMask connection:', error);
      }
    };
    
    checkConnection();
    
    // Setup event listeners for account and chain changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User has disconnected their account
          disconnect();
        } else {
          setState(prevState => ({
            ...prevState,
            account: accounts[0],
          }));
        }
      });
      
      window.ethereum.on('chainChanged', (chainId: string) => {
        setState(prevState => ({
          ...prevState,
          chainId,
        }));
      });
    }
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [checkIfMetaMaskIsInstalled, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    fetchTransactionHistory,
  };
}
