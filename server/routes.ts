import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeStorage } from "./storage";
import { 
  insertBudgetSchema, 
  insertTransactionSchema, 
  insertNotificationSchema 
} from "@shared/schema";

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
      
      // Validate the transaction data
      const transactionData = insertTransactionSchema.parse(req.body);
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
      const notificationData = insertNotificationSchema.parse(req.body);
      const newNotification = await storage.createNotification(notificationData);
      res.status(201).json(newNotification);
    } catch (error) {
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

  return httpServer;
}
