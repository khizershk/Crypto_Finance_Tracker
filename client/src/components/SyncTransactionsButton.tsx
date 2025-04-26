import { Button } from "@/components/ui/button";
import { useSyncTransactions } from "@/hooks/useSyncTransactions";
import { useMetaMask } from "@/hooks/useMetaMask";
import { Loader2 } from "lucide-react";

export function SyncTransactionsButton() {
  const { syncTransactions, isSyncing } = useSyncTransactions();
  const { isConnected, account, fetchTransactionHistory } = useMetaMask();

  // Add a debug function to check what's happening with the MetaMask connection
  const debugMetaMask = async () => {
    try {
      console.log("MetaMask connection status:", isConnected);
      console.log("Connected account:", account);
      
      if (isConnected && account) {
        console.log("Fetching transaction history directly from MetaMask...");
        const transactions = await fetchTransactionHistory();
        console.log("Raw transactions from MetaMask:", transactions);
        
        if (transactions.length === 0) {
          console.log("No transactions found. This could be because:");
          console.log("1. The wallet is new and has no transactions");
          console.log("2. You're on a test network with no transactions");
          console.log("3. There's an issue with the Etherscan API");
        }
      } else {
        console.log("Please connect MetaMask before syncing transactions");
      }
    } catch (error) {
      console.error("Error in debug function:", error);
    }
  };

  // Enhanced sync function with debugging
  const handleSync = async () => {
    await debugMetaMask();
    syncTransactions();
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
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
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Sync MetaMask
        </>
      )}
    </Button>
  );
}