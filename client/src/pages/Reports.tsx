import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useMetaMask } from '@/hooks/useMetaMask';
import { WalletAlert } from '@/components/WalletAlert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudget } from '@/hooks/useBudget';
import { DEFAULT_USER_ID } from '@/lib/types';
import { SpendingTrend } from '@/components/charts/SpendingTrend';
import { SpendingByCategory } from '@/components/charts/SpendingByCategory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FileDown, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { isConnected, connect } = useMetaMask();
  const [reportType, setReportType] = useState('monthly');
  const { transactions } = useTransactions(DEFAULT_USER_ID);
  const { budget, calculateBudgetUsage } = useBudget(DEFAULT_USER_ID);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality would be implemented here.');
    // In a real implementation, this would generate a PDF report
  };

  const handleDownloadCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }
    
    // Convert transactions to CSV
    const headers = ['Date', 'Type', 'From', 'To', 'Amount', 'Currency', 'Category', 'Status'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach((tx: any) => {
      const row = [
        new Date(tx.timestamp).toISOString().split('T')[0],
        tx.type,
        tx.from,
        tx.to,
        tx.amount,
        tx.currency,
        tx.category || 'Other',
        tx.status
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    
    // Create a download link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crypto_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSummaryData = () => {
    if (!transactions) return { sent: 0, received: 0, net: 0, count: 0 };
    
    const sent = transactions
      .filter((tx: any) => tx.type === 'sent')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    
    const received = transactions
      .filter((tx: any) => tx.type === 'received')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    
    return {
      sent: sent,
      received: received,
      net: received - sent,
      count: transactions.length
    };
  };

  const summary = getSummaryData();
  const budgetUsage = budget ? calculateBudgetUsage(transactions) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          {!isConnected && (
            <WalletAlert onConnect={connect} />
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
              <p className="text-slate-500">Generate and download reports of your crypto activity</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4" />
                <span>PDF Report</span>
              </Button>
              
              <Button className="gap-2" onClick={handleDownloadCSV}>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{summary.count}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">Total Sent</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-1">
                    {summary.sent.toFixed(4)} ETH
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">Total Received</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-1">
                    {summary.received.toFixed(4)} ETH
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">Net Balance</p>
                  <h3 className={`text-3xl font-bold mt-1 ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.net.toFixed(4)} ETH
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpendingTrend />
            <SpendingByCategory />
          </div>
          
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Overview of your crypto transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Transaction Types</h4>
                          <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Sent</span>
                              <span className="text-sm font-medium">
                                {transactions.filter((tx: any) => tx.type === 'sent').length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Received</span>
                              <span className="text-sm font-medium">
                                {transactions.filter((tx: any) => tx.type === 'received').length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Confirmed</span>
                              <span className="text-sm font-medium">
                                {transactions.filter((tx: any) => tx.status === 'confirmed').length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Pending</span>
                              <span className="text-sm font-medium">
                                {transactions.filter((tx: any) => tx.status === 'pending').length}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Top Categories</h4>
                          <div className="flex flex-col space-y-2">
                            {getTopCategories(transactions, 4).map((category, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">{category.name}</span>
                                <span className="text-sm font-medium">
                                  {category.count} transactions
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Monthly Trend</h4>
                        <div className="h-48">
                          <ResponsiveBarChart data={getMonthlyData(transactions)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No transaction data available</p>
                      <p className="text-sm text-slate-500 mt-1">Connect your wallet and sync to generate reports</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                  <CardDescription>Detailed list of all your transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.slice(0, 10).map((tx: any) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.type === 'sent' 
                                    ? 'bg-indigo-100 text-indigo-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {tx.type === 'sent' ? 'Sent' : 'Received'}
                                </span>
                              </TableCell>
                              <TableCell>{tx.category || 'Other'}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {tx.type === 'sent' ? tx.to : tx.from}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {tx.amount} {tx.currency}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {transactions.length > 10 && (
                        <div className="text-center mt-4">
                          <Button variant="outline" onClick={handleDownloadCSV}>
                            <FileDown className="h-4 w-4 mr-2" />
                            <span>Download Full List</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No transaction data available</p>
                      <p className="text-sm text-slate-500 mt-1">Connect your wallet and sync to generate reports</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="budget">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Analysis</CardTitle>
                  <CardDescription>Track your spending against your budget</CardDescription>
                </CardHeader>
                <CardContent>
                  {budget && budgetUsage ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-500">Total Budget</p>
                          <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {budgetUsage.total.toFixed(2)} {budget.currency}
                          </h3>
                        </div>
                        
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-500">Amount Spent</p>
                          <h3 className="text-2xl font-bold text-red-600 mt-1">
                            {budgetUsage.used.toFixed(2)} {budget.currency}
                          </h3>
                        </div>
                        
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-500">Remaining</p>
                          <h3 className="text-2xl font-bold text-green-600 mt-1">
                            {budgetUsage.remaining.toFixed(2)} {budget.currency}
                          </h3>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Budget Usage</h4>
                        <div className="bg-slate-100 h-6 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${budgetUsage.percentage > 90 ? 'bg-red-500' : 
                              budgetUsage.percentage > 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${budgetUsage.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-sm text-slate-500">0%</span>
                          <span className="text-sm font-medium">
                            {budgetUsage.percentage}% used
                          </span>
                          <span className="text-sm text-slate-500">100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Spending by Category</h4>
                        <div className="h-64">
                          <SpendingByCategory />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Budget Recommendations</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-blue-50 rounded border border-blue-100 text-blue-800">
                            {budgetUsage.percentage > 90 ? (
                              <p>You've nearly exhausted your budget. Consider adjusting your spending or increasing your budget for next period.</p>
                            ) : budgetUsage.percentage > 75 ? (
                              <p>You're using most of your budget. Monitor your spending to avoid exceeding your limit.</p>
                            ) : budgetUsage.percentage > 50 ? (
                              <p>You're within budget, but keep an eye on your spending for the rest of the period.</p>
                            ) : (
                              <p>You're well within your budget. Consider allocating funds to investments or savings.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No budget data available</p>
                      <p className="text-sm text-slate-500 mt-1">Set a budget in the Budget section to see analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Helper functions
function getTopCategories(transactions: any[], limit = 4) {
  if (!transactions || transactions.length === 0) return [];
  
  const categories: Record<string, number> = {};
  
  transactions.forEach((tx: any) => {
    const category = tx.category || 'Other';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  return Object.entries(categories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getMonthlyData(transactions: any[]) {
  if (!transactions || transactions.length === 0) return [];
  
  const monthlyData: Record<string, { sent: number; received: number }> = {};
  
  transactions.forEach((tx: any) => {
    const date = new Date(tx.timestamp);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { sent: 0, received: 0 };
    }
    
    if (tx.type === 'sent') {
      monthlyData[monthYear].sent += Number(tx.amount);
    } else {
      monthlyData[monthYear].received += Number(tx.amount);
    }
  });
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    sent: data.sent,
    received: data.received,
  }));
}

// Simple responsive bar chart component
function ResponsiveBarChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(item => Math.max(item.sent, item.received))
  );

  return (
    <div className="w-full h-full flex items-end">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center mx-1">
          <div className="w-full flex flex-col items-center">
            <div 
              className="w-full bg-red-500 rounded-t"
              style={{ height: `${(item.sent / maxValue) * 100}%` }}
            ></div>
            <div 
              className="w-full bg-green-500 rounded-t mt-1"
              style={{ height: `${(item.received / maxValue) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-center mt-2 w-full text-slate-600 truncate">
            {item.month}
          </div>
        </div>
      ))}
    </div>
  );
}
