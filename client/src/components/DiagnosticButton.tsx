import { Button } from "@/components/ui/button";
import { useMetaMask } from "@/hooks/useMetaMask";
import { toast } from "@/hooks/use-toast";

export function DiagnosticButton() {
  const { account, isConnected } = useMetaMask();

  const runDiagnostics = async () => {
    if (!isConnected || !account) {
      toast({
        title: "MetaMask not connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Running diagnostics",
        description: "Checking if we can retrieve transactions for your wallet...",
      });

      console.log(`Testing Etherscan API with account: ${account}`);
      const response = await fetch(`/api/test-etherscan/${account}`);
      const data = await response.json();

      console.log("API Test Result:", data);

      // Check if any transactions were found
      const mainnetHasTransactions = data.mainnet?.resultCount > 0;
      const sepoliaHasTransactions = data.sepolia?.resultCount > 0;

      if (mainnetHasTransactions || sepoliaHasTransactions) {
        toast({
          title: "Transactions found!",
          description: `Found ${mainnetHasTransactions ? data.mainnet.resultCount : 0} mainnet and ${sepoliaHasTransactions ? data.sepolia.resultCount : 0} Sepolia test network transactions.`,
          variant: "default"
        });
      } else {
        toast({
          title: "No transactions found",
          description: "We couldn't find any transactions for your wallet. This could be because you haven't made any transactions on these networks yet.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast({
        title: "Diagnostic failed",
        description: "There was an error running the diagnostics. Check the console for details.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={runDiagnostics}
      disabled={!isConnected}
      variant="outline"
      className="flex items-center gap-2"
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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      Run Diagnostics
    </Button>
  );
}