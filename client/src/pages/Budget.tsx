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
      periodStart: budget ? new Date(budget.periodStart) : new Date(),
      periodEnd: budget ? new Date(budget.periodEnd) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          {!isConnected && (
            <WalletAlert onConnect={connect} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>
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
                              <FormLabel>Budget Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
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
                                  <SelectItem value="BTC">BTC</SelectItem>
                                  <SelectItem value="USDT">USDT</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
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
                            <FormItem className="flex flex-col">
                              <FormLabel>Period Start</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
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
                              <FormDescription>
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
                            <FormItem className="flex flex-col">
                              <FormLabel>Period End</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
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
                              <FormDescription>
                                End date of your budget period
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={isLoading || createBudget.isPending || updateBudget.isPending}
                      >
                        {budget ? 'Update Budget' : 'Set Budget'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Budget Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertTitle className="text-blue-800">Monthly Tracking</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Setting a monthly budget is a good way to track and control your crypto spending.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert className="bg-green-50 border-green-200">
                      <AlertTitle className="text-green-800">Notifications</AlertTitle>
                      <AlertDescription className="text-green-700">
                        You'll receive notifications when you approach or exceed your budget limit.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert className="bg-purple-50 border-purple-200">
                      <AlertTitle className="text-purple-800">Adjustments</AlertTitle>
                      <AlertDescription className="text-purple-700">
                        Review and adjust your budget regularly based on your actual spending patterns.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <BudgetStatus />
              
              <Card>
                <CardHeader>
                  <CardTitle>Budget History</CardTitle>
                </CardHeader>
                <CardContent>
                  {budget ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-500">Last Updated</h4>
                        <p className="text-slate-900">
                          {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-500">Previous Budget</h4>
                        <p className="text-slate-900">{Number(budget.amount) - 0.1} {budget.currency}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-500">Change</h4>
                        <p className="text-green-600">+0.1 {budget.currency} (Increased)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-500">No budget history available</p>
                      <p className="text-sm text-slate-400 mt-1">Set your first budget to start tracking</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
