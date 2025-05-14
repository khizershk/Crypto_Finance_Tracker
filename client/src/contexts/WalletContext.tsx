import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface WalletContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  account: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    checkConnection();
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
          if (location.startsWith('/dashboard')) {
            setLocation('/');
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
        setAccount(null);
      }
    }
  };

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        setLocation('/dashboard');
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error('Please install MetaMask!');
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      setAccount(null);
      setIsConnected(false);
      if (location.startsWith('/dashboard')) {
        setLocation('/');
      }
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setIsConnected(false);
    if (location.startsWith('/dashboard')) {
      setLocation('/');
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
    setLocation('/');
  };

  return (
    <WalletContext.Provider value={{ isConnected, connect, disconnect, account }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}