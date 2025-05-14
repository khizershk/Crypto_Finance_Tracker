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
      // Access the environment variable from Vite
      const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
      console.log('Using Etherscan API with key:', apiKey ? apiKey.substring(0, 6) + '...' : 'Not Found');
      
      if (!apiKey) {
        console.error('Etherscan API key not found in environment variables');
        console.log('Please ensure VITE_ETHERSCAN_API_KEY is set in your .env file');
        throw new Error('Etherscan API key not configured. Please check your environment variables.');
      }
      
      // Determine the correct Etherscan API URL based on the network
      let baseUrl = 'https://api.etherscan.io/api';
      
      // Log the chainId to help debug
      console.log('Chain ID:', state.chainId);
      console.log('Network name:', chainName);
      
      // Check network by chainId (more reliable than name)
      if (chainName === 'sepolia' || state.chainId === '11155111') {
        baseUrl = 'https://api-sepolia.etherscan.io/api';
        console.log('Using Sepolia network API');
      } else if (chainName === 'goerli' || state.chainId === '5') {
        baseUrl = 'https://api-goerli.etherscan.io/api';
        console.log('Using Goerli network API');
      } else {
        console.log('Using Mainnet API');
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
      const formattedTransactions = [];
      
      // Process each transaction with error handling
      for (const tx of transactions) {
        try {
          if (!tx.hash) {
            console.warn('Skipping transaction with no hash:', tx);
            continue;
          }
          
          // Convert Wei to ETH (1 ETH = 10^18 Wei)
          let valueInEth = "0";
          try {
            // Use parseFloat for better decimal handling
            valueInEth = (parseFloat(tx.value) / 1e18).toString();
          } catch (e) {
            console.warn(`Error converting value for tx ${tx.hash}:`, e);
          }
          
          // Safely handle null account state
          const accountLower = state.account ? state.account.toLowerCase() : '';
          
          // Use default values for missing fields
          const formattedTx = {
            hash: tx.hash,
            from: tx.from || '0x0000000000000000000000000000000000000000',
            to: tx.to || '0x0000000000000000000000000000000000000000',
            value: valueInEth,
            timestamp: tx.timeStamp ? new Date(parseInt(tx.timeStamp) * 1000).toISOString() : new Date().toISOString(),
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            type: tx.from && tx.from.toLowerCase() === accountLower ? 'sent' : 'received'
          };
          
          formattedTransactions.push(formattedTx);
        } catch (txError) {
          console.error('Error processing transaction:', tx, txError);
        }
      }
      
      console.log('Fetched transactions from Etherscan:', formattedTransactions.length);
      
      // If we have many transactions, just return the most recent ones
      return formattedTransactions.slice(0, 20); // Return up to 20 transactions
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
