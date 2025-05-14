// pages/HomePage.jsx
import { useLocation } from "wouter";
import { ethers } from "ethers";

function HomePage() {
  const [location, setLocation] = useLocation();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setLocation("/dashboard");
      } catch (err) {
        alert("Connection request rejected");
        console.error(err);
      }
    } else {
      alert("MetaMask not detected");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-20"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giIC8+PC9maWx0ZXI+PC9kZWZzPjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjQiLz48L3N2Zz4=')] opacity-30"></div>
      <div className="z-10 text-center px-4">
        <h1 className="text-5xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-fade-in">
          Welcome to Crypto Finance Tracker
        </h1>
        <p className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto animate-fade-in-delayed">
          Connect your MetaMask wallet to start tracking your crypto portfolio and transactions in real-time.
        </p>
        <button
          onClick={connectWallet}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fade-in-delayed-more"
        >
          Connect MetaMask
        </button>
      </div>
    </div>
  );
}

export default HomePage;
