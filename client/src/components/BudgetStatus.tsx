import { useBudget } from '@/hooks/useBudget';
import { useTransactions } from '@/hooks/useTransactions';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_USER_ID } from '@/lib/types';

export function BudgetStatus() {
  const { budget, isLoading: budgetLoading, getDaysRemaining } = useBudget(DEFAULT_USER_ID);
  const { transactions, isLoading: transactionsLoading } = useTransactions(DEFAULT_USER_ID);
  
  if (budgetLoading || transactionsLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mb-2 flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2.5 w-full mb-2" />
        <Skeleton className="h-3 w-32 mt-2" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Budget Set</h3>
          <p className="text-sm text-slate-600">
            Set a budget in the Budget section to start tracking your spending.
          </p>
        </div>
      </div>
    );
  }

  const { used, total, percentage, remaining } = calculateBudgetUsage(budget, transactions);
  const daysRemaining = getDaysRemaining();
  
  let statusColor = "bg-green-100 text-green-800";
  if (percentage > 90) {
    statusColor = "bg-red-100 text-red-800";
  } else if (percentage > 75) {
    statusColor = "bg-amber-100 text-amber-800";
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Monthly Budget</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
          {percentage}% Used
        </span>
      </div>
      <div className="mb-2 flex justify-between text-sm font-medium">
        <span className="text-slate-600">{used.toFixed(2)} {budget.currency} spent</span>
        <span className="text-slate-800">of {total.toFixed(2)} {budget.currency} budget</span>
      </div>
      <Progress value={percentage} className="h-2.5" />
      <p className="text-xs text-slate-500 mt-2">{daysRemaining} days remaining in current period</p>
    </div>
  );
}

function calculateBudgetUsage(budget: any, transactions: any[] = []) {
  const budgetAmount = Number(budget.amount);
  const spent = transactions.reduce((total, tx) => {
    if (tx.type === 'sent' &&
        new Date(tx.timestamp) >= new Date(budget.periodStart) &&
        new Date(tx.timestamp) <= new Date(budget.periodEnd)) {
      return total + Number(tx.amount);
    }
    return total;
  }, 0);
  
  const remaining = budgetAmount - spent;
  const percentage = Math.min(Math.round((spent / budgetAmount) * 100), 100);
  
  return {
    used: spent,
    total: budgetAmount,
    percentage,
    remaining,
  };
}
