import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { DEFAULT_USER_ID } from '@/lib/types';

type TimeRange = 'month' | 'lastMonth' | 'year';

export function SpendingByCategory() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { getSpendingByCategory } = useTransactions(DEFAULT_USER_ID);
  
  const data = getSpendingByCategory();
  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#f59e0b'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">Spending by Category</CardTitle>
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
        >
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        <div className="h-full flex">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={1}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ETH`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 flex flex-col justify-center space-y-3">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="text-sm text-slate-600">
                  {entry.name} ({calculatePercentage(entry.value, data)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function calculatePercentage(value: number, data: { value: number }[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
