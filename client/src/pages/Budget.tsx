import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useMetaMask } from '@/hooks/useMetaMask';
import { WalletAlert } from '@/components/WalletAlert';
import { BudgetStatus } from '@/components/BudgetStatus';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useBudget } from '@/hooks/useBudget';
import { DEFAULT_USER_ID } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const budgetFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  periodStart: z.date({ required_error: "Start date is required" }),
  periodEnd: z.date({ required_error: "End date is required" }),
  currency: z.string().min(1, { message: "Currency is required" }),
}).refine(data => data.periodEnd > data.periodStart, {
  message: "End date must be after start date",
  path: ["periodEnd"],
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function Budget() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { isConnected, connect } = useMetaMask();
  const { budget, createBudget, updateBudget, isLoading } = useBudget(DEFAULT_USER_ID);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: budget ? Number(budget.amount) : 0,
      periodStart: budget && budget.periodStart ? new Date(budget.periodStart) : new Date(),
      periodEnd: budget && budget.periodEnd ? new Date(budget.periodEnd) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      currency: budget?.currency || 'ETH',
    },
  });

  const onSubmit = (data: BudgetFormValues) => {
    if (budget) {
      updateBudget.mutate({
        id: budget.id,
        budgetData: data,
      });
    } else {
      createBudget.mutate(data);
    }
  };

  // Helper function to safely format date
  const formatDate = (date: any): string => {
    return date && date instanceof Date && !isNaN(date.getTime()) 
      ? format(date, "PPP") 
      : "Pick a date";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 lg:p-6">
          {!isConnected && (
            <WalletAlert onConnect={connect} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground dark:text-white">Budget Management</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-gray-400">
                    Set or update your spending budget for crypto transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground dark:text-gray-200">Budget Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-muted-foreground dark:text-gray-400">
                                The maximum amount you want to spend
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ETH">ETH</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-muted-foreground dark:text-gray-400">
                                Currency for your budget
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="periodStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {formatDate(field.value)}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription className="text-muted-foreground dark:text-gray-400">
                                Start date of your budget period
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="periodEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {formatDate(field.value)}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription className="text-muted-foreground dark:text-gray-400">
                                End date of your budget period
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="relative"
                      >
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/50 rounded-md">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {budget ? "Update Budget" : "Create Budget"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <BudgetStatus />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
