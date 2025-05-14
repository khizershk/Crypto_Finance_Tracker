// Utility script to test Etherscan API directly from the server
import fetch from 'node-fetch';

async function fetchEtherscanTransactions(address, apiKey, network = 'mainnet') {
  try {
    // Determine the correct Etherscan API URL based on the network
    let baseUrl = 'https://api.etherscan.io/api';
    if (network === 'sepolia') {
      baseUrl = 'https://api-sepolia.etherscan.io/api';
    } else if (network === 'goerli') {
      baseUrl = 'https://api-goerli.etherscan.io/api';
    }
    
    console.log(`Using Etherscan API URL: ${baseUrl}`);
    console.log(`API Key available: ${apiKey ? 'Yes' : 'No'}`);
    console.log(`Wallet address: ${address}`);
    
    // Fetch transactions
    const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
    console.log(`Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Etherscan API response status:', data.status);
    console.log('Etherscan API response message:', data.message);
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`Found ${data.result.length} transactions`);
      
      if (data.result.length > 0) {
        console.log('Sample transaction:', data.result[0]);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return { status: '0', message: error.message, result: [] };
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const address = args[0];
const apiKey = args[1] || process.env.ETHERSCAN_API_KEY;
const network = args[2] || 'mainnet';

if (!address) {
  console.error('Please provide a wallet address as the first argument');
  process.exit(1);
}

if (!apiKey) {
  console.error('Please provide an Etherscan API key as the second argument or set ETHERSCAN_API_KEY environment variable');
  process.exit(1);
}

// Run the function
fetchEtherscanTransactions(address, apiKey, network)
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));