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
  updateUserPreferences(userId: number, preferences: User['preferences']): Promise<User | undefined>;
  
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
  protected users: Map<number, User>;
  protected budgets: Map<number, Budget>;
  protected transactions: Map<number, Transaction>;
  protected notifications: Map<number, Notification>;
  
  protected nextUserId: number;
  protected nextBudgetId: number;
  protected nextTransactionId: number;
  protected nextNotificationId: number;

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
    const user: User = { 
      ...insertUser, 
      id,
      preferences: {
        theme: 'light',
        notifications: true,
        currency: 'ETH'
      }
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPreferences(userId: number, preferences: User['preferences']): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, preferences };
    this.users.set(userId, updatedUser);
    return updatedUser;
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

// Import fs and path using ES modules
import * as fs from 'fs';
import * as path from 'path';

// Enhanced memory storage with file persistence
export class PersistentMemStorage extends MemStorage {
  private filePath: string = './data/persistent-storage.json';
  
  constructor() {
    super();
    this.loadFromFile();
    
    // Save data every 5 minutes
    setInterval(() => this.saveToFile(), 5 * 60 * 1000);
  }
  
  private loadFromFile() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Load data if file exists
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        
        // Restore maps from the loaded data
        this.users = new Map(Object.entries(data.users || {}).map(([k, v]) => [Number(k), v as User]));
        this.budgets = new Map(Object.entries(data.budgets || {}).map(([k, v]) => [Number(k), v as Budget]));
        this.transactions = new Map(Object.entries(data.transactions || {}).map(([k, v]) => [Number(k), v as Transaction]));
        this.notifications = new Map(Object.entries(data.notifications || {}).map(([k, v]) => [Number(k), v as Notification]));
        
        // Set ID counters
        this.nextUserId = Math.max(1, ...Array.from(this.users.keys())) + 1;
        this.nextBudgetId = Math.max(1, ...Array.from(this.budgets.keys())) + 1;
        this.nextTransactionId = Math.max(1, ...Array.from(this.transactions.keys())) + 1;
        this.nextNotificationId = Math.max(1, ...Array.from(this.notifications.keys())) + 1;
        
        console.log('Loaded data from persistent storage');
      }
    } catch (error) {
      console.error('Error loading data from file:', error);
    }
  }
  
  private saveToFile() {
    try {
      // Convert maps to objects for JSON serialization
      const data = {
        users: Object.fromEntries(this.users),
        budgets: Object.fromEntries(this.budgets),
        transactions: Object.fromEntries(this.transactions),
        notifications: Object.fromEntries(this.notifications)
      };
      
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write data to file
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Saved data to persistent storage');
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
  }
  
  // Override create methods to save after each important change
  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await super.createUser(insertUser);
    this.saveToFile();
    return user;
  }
  
  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const budget = await super.createBudget(insertBudget);
    this.saveToFile();
    return budget;
  }
  
  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = await super.updateBudget(id, budgetData);
    this.saveToFile();
    return budget;
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction = await super.createTransaction(insertTransaction);
    this.saveToFile();
    return transaction;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification = await super.createNotification(insertNotification);
    this.saveToFile();
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = await super.markNotificationAsRead(id);
    this.saveToFile();
    return notification;
  }
}

// Default to persistent memory storage
let storage: IStorage = new PersistentMemStorage();

// Function to choose appropriate storage implementation
export async function initializeStorage(storageType: string = 'mongodb'): Promise<IStorage> {
  switch (storageType) {
    case 'persistent-memory':
      storage = new PersistentMemStorage();
      console.log('Using persistent memory storage');
      break;
    case 'mongodb':
      const { MongoDBStorage } = await import('./mongodb-storage');
      storage = new MongoDBStorage();
      console.log('Using MongoDB storage');
      break;
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
  return storage;
}

export { storage };
