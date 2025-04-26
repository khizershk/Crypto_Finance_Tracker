import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MetaMaskState } from '@/lib/types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

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
      
      // Get transactions sent by the user
      const sentTxs = await provider.getHistory(state.account);
      console.log('Raw transactions from MetaMask:', sentTxs);
      
      // Format transactions
      const formattedTxs = sentTxs.map(tx => {
        const result = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '',
          value: ethers.formatEther(tx.value || 0),
          timestamp: new Date().toISOString(), // Etherscan API needed for actual timestamp
          status: tx.confirmations > 0 ? 'confirmed' : 'pending',
        };
        console.log('Formatted transaction:', result);
        return result;
      });
      
      console.log('Formatted transactions:', formattedTxs);
      return formattedTxs;
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
