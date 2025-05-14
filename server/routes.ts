import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeStorage } from "./storage";
import { 
  insertBudgetSchema, 
  insertTransactionSchema, 
  insertNotificationSchema,
  insertUserSchema
} from "@shared/schema";
import { sendBudgetExceededEmail } from "./utils/sendEmail";

import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Middleware to handle ZodErrors
  const handleZodError = (err: Error, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    next(err);
  };

  app.use(handleZodError);

  // User preferences routes
  app.get('/api/users/:userId/preferences', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences);
  });

  app.patch('/api/users/:userId/preferences', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { theme, notifications, currency } = req.body;
    const preferences = {
      theme: theme || 'light',
      notifications: notifications ?? true,
      currency: currency || 'ETH'
    };

    try {
      const updatedUser = await storage.updateUserPreferences(userId, preferences);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(updatedUser.preferences);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });


  // Budget routes
  app.get('/api/budget', async (req, res) => {
    // Default route that works with the default query client
    const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
    const budget = await storage.getBudget(userId);
    if (!budget) {
      return res.json(null); // Return null instead of 404 for easier frontend handling
    }
    res.json(budget);
  });

  app.get('/api/budget/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const budget = await storage.getBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  });

  app.post('/api/budget', async (req, res) => {
    try {
      const budgetData = insertBudgetSchema.parse(req.body);
      const newBudget = await storage.createBudget(budgetData);
      res.status(201).json(newBudget);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to create budget' });
    }
  });

  app.put('/api/budget/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid budget ID' });
    }

    try {
      const budgetData = insertBudgetSchema.partial().parse(req.body);
      const updatedBudget = await storage.updateBudget(id, budgetData);
      
      if (!updatedBudget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      res.json(updatedBudget);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to update budget' });
    }
  });

  // Transaction routes
  // Get a transaction by hash - must come before the userId route to avoid conflicts
  app.get('/api/transactions/hash/:hash', async (req, res) => {
    try {
      const hash = req.params.hash;
      console.log(`Looking up transaction with hash: ${hash}`);
      
      const transaction = await storage.getTransactionByHash(hash);
      
      if (!transaction) {
        console.log(`Transaction with hash ${hash} not found`);
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      console.log(`Found transaction:`, transaction);
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction by hash:', error);
      res.status(500).json({ message: 'Error fetching transaction', error: String(error) });
    }
  });

  app.get('/api/transactions', async (req, res) => {
    // Default route that works with the default query client
    const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });
  
  app.get('/api/transactions/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      console.log('Creating new transaction with data:', JSON.stringify(req.body));
      
      // Prepare the transaction data with proper date type for timestamp
      const rawData = req.body;
      
      // Convert string timestamp to Date object if it's a string
      if (rawData.timestamp && typeof rawData.timestamp === 'string') {
        rawData.timestamp = new Date(rawData.timestamp);
      }
      
      // Validate the transaction data after conversion
      const transactionData = insertTransactionSchema.parse(rawData);
      console.log('Transaction data parsed successfully');
      
      // Check if transaction already exists
      console.log('Checking if transaction already exists with hash:', transactionData.hash);
      const existingTransaction = await storage.getTransactionByHash(transactionData.hash);
      
      if (existingTransaction) {
        console.log('Transaction already exists in database:', existingTransaction);
        return res.status(409).json({ message: 'Transaction already exists' });
      }
      
      console.log('Transaction is new, proceeding with creation');
      const newTransaction = await storage.createTransaction(transactionData);
      console.log('Transaction created successfully:', newTransaction);
      
      // Check if this transaction makes the user exceed their budget
      const userId = transactionData.userId;
      console.log(`Checking budget for user ${userId}`);
      const budget = await storage.getBudget(userId);
      
      if (budget) {
        console.log('User has a budget:', budget);
        const transactions = await storage.getTransactions(userId);
        
        const periodTransactions = transactions.filter(
          (tx: any) => new Date(tx.timestamp) >= new Date(budget.periodStart) && 
                new Date(tx.timestamp) <= new Date(budget.periodEnd) &&
                tx.type === 'sent'
        );
        
        console.log(`Found ${periodTransactions.length} transactions in budget period`);
        
        const totalSpent = periodTransactions.reduce(
          (sum: number, tx: any) => sum + Number(tx.amount), 0
        );
        
        console.log(`Total spent: ${totalSpent}, Budget: ${budget.amount}`);
        
        if (totalSpent > Number(budget.amount)) {
          console.log('Budget exceeded, creating notification');
          // Create budget notification
          await storage.createNotification({
            userId,
            message: 'You have exceeded your budget for this period!',
            timestamp: new Date(),
          });
          console.log('Budget notification created');
          
          // Send email notification
          const user = await storage.getUser(userId);
          if (user) {
            const exceededAmount = totalSpent - Number(budget.amount);
            await sendBudgetExceededEmail(user.username, exceededAmount);
          }
        }
      } else {
        console.log('User has no budget set');
      }
      
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          message: 'Transaction data validation failed', 
          details: validationError.message 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to create transaction',
        error: String(error)
      });
    }
  });

  app.get('/api/categorized-transactions', async (req, res) => {
    // Default route that works with the default query client
    const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
    const categorizedTransactions = await storage.getCategorizedTransactions(userId);
    res.json(categorizedTransactions);
  });

  app.get('/api/categorized-transactions/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const categorizedTransactions = await storage.getCategorizedTransactions(userId);
    res.json(categorizedTransactions);
  });

  // Notifications routes
  app.get('/api/notifications/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      // ✅ Convert timestamp string to Date object BEFORE parsing
      const fixedBody = {
        ...req.body,
        timestamp: new Date(req.body.timestamp),
      };
  
      const notificationData = insertNotificationSchema.parse(fixedBody);
  
      const newNotification = await storage.createNotification(notificationData);
      res.status(201).json(newNotification);
    } catch (error) {
      console.error('Notification Error:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });
  
  
  
  app.patch('/api/notifications/:id/read', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const updatedNotification = await storage.markNotificationAsRead(id);
    
    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(updatedNotification);
  });
  
  // Sync transactions from user's wallet
  app.post('/api/sync-transactions', async (req, res) => {
    try {
      const { transactions, userId = 1 } = req.body;
      
      console.log('Received sync transactions request with data:', JSON.stringify(req.body));
      
      if (!Array.isArray(transactions)) {
        console.error('Invalid request: transactions is not an array', req.body);
        return res.status(400).json({ message: 'Transactions must be an array' });
      }
      
      console.log(`Processing ${transactions.length} transactions`);
      
      const newTransactions = [];
      for (const tx of transactions) {
        console.log(`Processing transaction hash: ${tx.hash}`);
        
        // Check if transaction already exists
        const existingTx = await storage.getTransactionByHash(tx.hash);
        
        if (existingTx) {
          console.log(`Transaction ${tx.hash} already exists in database`);
        } else {
          // Add new transaction to our database
          const transactionData = {
            userId,
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: tx.value,
            timestamp: new Date(tx.timestamp), // Convert string timestamp to Date object
            currency: 'ETH',
            category: null,
            status: tx.status,
            type: tx.type,
          };
          
          console.log(`Adding new transaction:`, transactionData);
          
          try {
            const newTx = await storage.createTransaction(transactionData);
            console.log(`Transaction added successfully with ID: ${newTx.id}`);
            newTransactions.push(newTx);
          } catch (insertError) {
            console.error(`Error adding transaction ${tx.hash}:`, insertError);
          }
        }
      }
      
      console.log(`Sync complete. Added ${newTransactions.length} new transactions`);
      
      res.json({ 
        success: true, 
        message: `${newTransactions.length} new transactions synced`,
        transactions: newTransactions
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      res.status(500).json({ message: 'Failed to sync transactions', error: String(error) });
    }
  });
  
  // Test endpoint for direct Etherscan API access
  app.get('/api/test-etherscan/:address', async (req, res) => {
    try {
      const address = req.params.address;
      const apiKey = process.env.ETHERSCAN_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Etherscan API key not configured' });
      }
      
      console.log(`Testing Etherscan API for address: ${address}`);
      
      // Test mainnet
      const mainnetUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      console.log(`Fetching from mainnet: ${mainnetUrl}`);
      
      const mainnetResponse = await fetch(mainnetUrl);
      const mainnetData = await mainnetResponse.json();
      
      // Test Sepolia testnet
      const sepoliaUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      console.log(`Fetching from Sepolia testnet: ${sepoliaUrl}`);
      
      const sepoliaResponse = await fetch(sepoliaUrl);
      const sepoliaData = await sepoliaResponse.json();
      
      res.json({
        status: 'success',
        mainnet: {
          status: mainnetData.status,
          message: mainnetData.message,
          resultCount: Array.isArray(mainnetData.result) ? mainnetData.result.length : 0,
          sample: Array.isArray(mainnetData.result) && mainnetData.result.length > 0 ? mainnetData.result[0] : null
        },
        sepolia: {
          status: sepoliaData.status,
          message: sepoliaData.message,
          resultCount: Array.isArray(sepoliaData.result) ? sepoliaData.result.length : 0,
          sample: Array.isArray(sepoliaData.result) && sepoliaData.result.length > 0 ? sepoliaData.result[0] : null
        }
      });
    } catch (error) {
      console.error('Error testing Etherscan API:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  return httpServer;
}
