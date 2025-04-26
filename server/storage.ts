import {
  users, type User, type InsertUser,
  budgets, type Budget, type InsertBudget,
  transactions, type Transaction, type InsertTransaction,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Budget operations
  getBudget(userId: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  
  // Transaction operations
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransactionByHash(hash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getCategorizedTransactions(userId: number): Promise<Record<string, Transaction[]>>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private budgets: Map<number, Budget>;
  private transactions: Map<number, Transaction>;
  private notifications: Map<number, Notification>;
  
  private nextUserId: number;
  private nextBudgetId: number;
  private nextTransactionId: number;
  private nextNotificationId: number;

  constructor() {
    this.users = new Map();
    this.budgets = new Map();
    this.transactions = new Map();
    this.notifications = new Map();
    
    this.nextUserId = 1;
    this.nextBudgetId = 1;
    this.nextTransactionId = 1;
    this.nextNotificationId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Budget methods
  async getBudget(userId: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      (budget) => budget.userId === userId,
    );
  }
  
  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.nextBudgetId++;
    // Format data to match our Budget type
    const budget: Budget = {
      ...insertBudget,
      id,
      amount: insertBudget.amount.toString(),
      periodStart: new Date(insertBudget.periodStart).toISOString(),
      periodEnd: new Date(insertBudget.periodEnd).toISOString(),
    };
    this.budgets.set(id, budget);
    return budget;
  }
  
  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const currentBudget = this.budgets.get(id);
    if (!currentBudget) return undefined;
    
    // Process data to match our types
    const processedData: Partial<Budget> = {};
    if (budgetData.amount !== undefined) {
      processedData.amount = budgetData.amount.toString();
    }
    if (budgetData.periodStart !== undefined) {
      processedData.periodStart = new Date(budgetData.periodStart).toISOString();
    }
    if (budgetData.periodEnd !== undefined) {
      processedData.periodEnd = new Date(budgetData.periodEnd).toISOString();
    }
    if (budgetData.currency !== undefined) {
      processedData.currency = budgetData.currency;
    }
    if (budgetData.userId !== undefined) {
      processedData.userId = budgetData.userId;
    }
    
    const updatedBudget: Budget = { ...currentBudget, ...processedData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.hash === hash,
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.nextTransactionId++;
    // Format data to match our Transaction type
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      category: insertTransaction.category || null,
      amount: insertTransaction.amount.toString(),
      timestamp: new Date(insertTransaction.timestamp).toISOString()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getCategorizedTransactions(userId: number): Promise<Record<string, Transaction[]>> {
    const userTransactions = await this.getTransactions(userId);
    return userTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }
  
  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.nextNotificationId++;
    // Format data to match our Notification type
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      read: false,
      timestamp: new Date(insertNotification.timestamp).toISOString()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

// Default to in-memory storage
let storage: IStorage = new MemStorage();

// Function to choose appropriate storage implementation
export async function initializeStorage(type: 'postgres' | 'mongodb' | 'memory'): Promise<IStorage> {
  try {
    if (type === 'postgres') {
      try {
        const { PostgresStorage } = await import('./postgres-storage');
        storage = new PostgresStorage();
        console.log('Using PostgreSQL storage');
      } catch (error) {
        console.error('Failed to initialize PostgreSQL storage, falling back to in-memory storage:', error);
        storage = new MemStorage();
      }
    } else if (type === 'mongodb') {
      try {
        const { MongoDBStorage } = await import('./mongodb-storage');
        storage = new MongoDBStorage();
        console.log('Using MongoDB storage');
      } catch (error) {
        console.error('Failed to initialize MongoDB storage, falling back to in-memory storage:', error);
        storage = new MemStorage();
      }
    } else {
      console.log('Using in-memory storage');
      storage = new MemStorage();
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    storage = new MemStorage();
  }
  return storage;
}

export { storage };
