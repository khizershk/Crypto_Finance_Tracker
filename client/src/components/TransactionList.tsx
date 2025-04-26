import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { DEFAULT_USER_ID } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

interface TransactionListProps {
  limit?: number;
}

export function TransactionList({ limit }: TransactionListProps) {
  const { transactions, isLoading } = useTransactions(DEFAULT_USER_ID);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-slate-200">
          <CardTitle className="text-lg font-semibold text-slate-800">Recent Transactions</CardTitle>
          <Skeleton className="h-4 w-14" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {Array(5).fill(0).map((_, index) => (
                    <th key={index} scope="col" className="px-5 py-3 text-left">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Array(3).fill(0).map((_, index) => (
                  <tr key={index}>
                    {Array(5).fill(0).map((_, colIndex) => (
                      <td key={colIndex} className="px-5 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayTransactions = limit ? 
    (transactions as any[])?.slice(0, limit) : 
    transactions;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">Recent Transactions</CardTitle>
        <Link href="/transactions" className="text-primary hover:text-primary-700 text-sm font-medium">
          View All
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">To/From</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {displayTransactions?.length > 0 ? (
                displayTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'sent' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        <i className={`${tx.type === 'sent' ? 'ri-arrow-right-line' : 'ri-arrow-left-line'} mr-1`}></i>
                        {tx.type === 'sent' ? 'Sent' : 'Received'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          getCategoryColorClasses(tx.category)
                        } flex items-center justify-center`}>
                          <i className={getCategoryIcon(tx.category)}></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-slate-900 font-medium">{getCategoryName(tx.category)}</p>
                          <p className="text-xs text-slate-500 font-mono">{shortenAddress(tx.type === 'sent' ? tx.to : tx.from)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No transactions found. Connect your wallet and sync to see your transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function shortenAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getCategoryName(category: string) {
  if (!category) return 'Unknown';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'exchange':
      return 'ri-exchange-dollar-line';
    case 'defi':
      return 'ri-coin-line';
    case 'nfts':
      return 'ri-nft-line';
    default:
      return 'ri-shopping-bag-line';
  }
}

function getCategoryColorClasses(category: string) {
  switch (category?.toLowerCase()) {
    case 'exchange':
      return 'bg-indigo-100 text-indigo-600';
    case 'defi':
      return 'bg-blue-100 text-blue-600';
    case 'nfts':
      return 'bg-amber-100 text-amber-600';
    default:
      return 'bg-red-100 text-red-600';
  }
}
