import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budget from "@/pages/Budget";
import Reports from "@/pages/Reports";
import NotificationsPage from "@/pages/notifications";
import Preferences from "@/pages/Preferences";
import HomePage from "./pages/HomePage";
import { WalletProvider } from "./contexts/WalletContext";

function Router() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/" component={HomePage} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/budget" component={Budget} />
      <Route path="/reports" component={Reports} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/preferences" component={Preferences} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
