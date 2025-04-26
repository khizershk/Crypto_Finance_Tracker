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
      
      const network = await provider.getNetwork();
      const chainName = network.name === 'homestead' ? 'mainnet' : network.name;
      console.log('Current network:', chainName);
      
      // Using Etherscan API to get real transaction history
      const apiKey = import.meta.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY;
      if (!apiKey) {
        console.error('Etherscan API key not found');
        throw new Error('Etherscan API key not found');
      }
      
      // Determine the correct Etherscan API URL based on the network
      let baseUrl = 'https://api.etherscan.io/api';
      if (chainName === 'sepolia') {
        baseUrl = 'https://api-sepolia.etherscan.io/api';
      } else if (chainName === 'goerli') {
        baseUrl = 'https://api-goerli.etherscan.io/api';
      }
      
      // Fetch both normal transactions and internal transactions
      const url = `${baseUrl}?module=account&action=txlist&address=${state.account}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      console.log('Fetching transactions from Etherscan');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== '1' && data.message !== 'No transactions found') {
        console.error('Etherscan API error:', data);
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      // Internal transactions (like contract interactions)
      const internalUrl = `${baseUrl}?module=account&action=txlistinternal&address=${state.account}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      const internalResponse = await fetch(internalUrl);
      const internalData = await internalResponse.json();
      
      // Combine both transaction types
      const transactions = [...(data.result || []), ...(internalData.status === '1' ? internalData.result : [])];
      
      // Format the transactions to match our application's format
      const formattedTransactions = transactions.map(tx => {
        // Convert Wei to ETH (1 ETH = 10^18 Wei)
        const valueInEth = (parseInt(tx.value) / 1e18).toString();
        
        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: valueInEth,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
          type: tx.from.toLowerCase() === state.account.toLowerCase() ? 'sent' : 'received'
        };
      });
      
      console.log('Fetched transactions from Etherscan:', formattedTransactions.length);
      return formattedTransactions.slice(0, 10); // Limit to 10 most recent transactions
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
