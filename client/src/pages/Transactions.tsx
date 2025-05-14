import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useMetaMask } from '@/hooks/useMetaMask';
import { WalletAlert } from '@/components/WalletAlert';
import { TransactionList } from '@/components/TransactionList';
import { SyncTransactionsButton } from '@/components/SyncTransactionsButton';
import { DiagnosticButton } from '@/components/DiagnosticButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function Transactions() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { isConnected, connect } = useMetaMask();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          {!isConnected && (
            <WalletAlert onConnect={connect} />
          )}
          
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="search" className="text-sm font-medium text-gray-700 block mb-1">
                    Search Transactions
                  </label>
                  <Input
                    id="search"
                    placeholder="Search by address or hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-48">
                  <label htmlFor="filter" className="text-sm font-medium text-gray-700 block mb-1">
                    Filter
                  </label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger id="filter" className="w-full">
                      <SelectValue placeholder="Filter transactions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-auto flex gap-2">
                  <Button 
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                  {isConnected && (
                    <>
                      <SyncTransactionsButton />
                      <DiagnosticButton />
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => window.open('https://etherscan.io/login  /', '_blank')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Explorer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TransactionList />
        </main>
      </div>
    </div>
  );
}
