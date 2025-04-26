import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface WalletAlertProps {
  onConnect: () => void;
}

export function WalletAlert({ onConnect }: WalletAlertProps) {
  return (
    <Alert className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
      <div className="flex items-center gap-4">
        <i className="ri-wallet-3-line text-xl"></i>
        <div className="flex-1">
          <AlertTitle className="font-medium">Connect your MetaMask wallet</AlertTitle>
          <AlertDescription className="text-sm mt-0.5">
            To start tracking your transactions, please connect your MetaMask wallet.
          </AlertDescription>
        </div>
        <Button 
          className="ml-4 py-1.5 px-3 text-sm font-medium rounded bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          onClick={onConnect}
        >
          Connect
        </Button>
      </div>
    </Alert>
  );
}
