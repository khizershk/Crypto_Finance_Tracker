import { useState } from 'react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { WalletAlert } from '@/components/WalletAlert';
import { BudgetStatus } from '@/components/BudgetStatus';
import { SpendingTrend } from '@/components/charts/SpendingTrend';
import { SpendingByCategory } from '@/components/charts/SpendingByCategory';
import { TransactionList } from '@/components/TransactionList';
import { Card, CardContent } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { DEFAULT_USER_ID } from '@/lib/types';
import { Transaction } from '@/lib/types';

export default function Dashboard() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { isConnected, connect } = useMetaMask();
  const { transactions } = useTransactions(DEFAULT_USER_ID);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const getEthBalance = () => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const sent = transactions
      .filter((tx: Transaction) => tx.type === 'sent')
      .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0);
    
    const received = transactions
      .filter((tx: Transaction) => tx.type === 'received')
      .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0);
    
    return received - sent;
  };

  const getRecentActivity = () => {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return { count: 0, lastTx: 'N/A' };
    }

    // Get transactions from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekTxs = transactions.filter((tx: Transaction) => 
      new Date(tx.timestamp) > oneWeekAgo
    );
    
    // Find the most recent transaction
    const sortedTxs = [...transactions].sort((a: Transaction, b: Transaction) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const lastTx = sortedTxs.length > 0 ? sortedTxs[0].timestamp : 'N/A';
    
    return {
      count: weekTxs.length,
      lastTx: lastTx !== 'N/A' ? formatTimeAgo(new Date(lastTx)) : 'N/A'
    };
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    return `${diffDay} days ago`;
  };

  const { count: weeklyTxCount, lastTx: lastTxTime } = getRecentActivity();
  const balance = getEthBalance();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-background dark:bg-gray-900 p-4 lg:p-6">
          {!isConnected && (
            <WalletAlert onConnect={connect} />
          )}
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <BudgetStatus />
            
            <Card className="p-5 rounded-lg border shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">Total Value</h3>
                  <i className="ri-money-dollar-circle-line text-xl text-slate-400"></i>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-foreground dark:text-white">{balance.toFixed(2)} ETH</span>
                  <span className="ml-2 text-sm text-green-600">+0.05 (2.1%)</span>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-muted-foreground dark:text-gray-400">≈ ${(balance * 1700).toFixed(2)} USD</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">↑ 2.3%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-5 rounded-lg border shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">Recent Activity</h3>
                  <i className="ri-history-line text-xl text-slate-400"></i>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-foreground dark:text-white">{weeklyTxCount}</span>
                  <span className="ml-2 text-sm text-slate-600">transactions this week</span>
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <span className="text-muted-foreground dark:text-gray-400">Last transaction:</span>
                  <span className="font-medium text-foreground dark:text-gray-300">{lastTxTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpendingTrend />
            <SpendingByCategory />
          </div>
          
          <TransactionList limit={5} />
        </main>
      </div>
    </div>
  );
}
