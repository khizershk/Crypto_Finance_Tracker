import { IStorage } from './storage';
import { db } from './db';
import {
  type User,
  type Budget,
  type Transaction,
  type Notification,
  type InsertUser,
  type InsertBudget,
  type InsertTransaction,
  type InsertNotification,
  users,
  budgets,
  transactions,
  notifications
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error('Database connection not available');
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  // Budget operations
  async getBudget(userId: number): Promise<Budget | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(budgets).where(eq(budgets.userId, userId));
      return result[0];
    } catch (error) {
      console.error('Error in getBudget:', error);
      return undefined;
    }
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    if (!db) throw new Error('Database connection not available');
    try {
      // Use SQL directly to insert the budget
      const userId = insertBudget.userId;
      const amount = insertBudget.amount.toString();
      const periodStart = new Date(insertBudget.periodStart).toISOString();
      const periodEnd = new Date(insertBudget.periodEnd).toISOString();
      const currency = insertBudget.currency;
      
      // Use SQL directly to avoid type issues
      const query = sql`
        INSERT INTO budgets ("userId", amount, "periodStart", "periodEnd", currency)
        VALUES (${userId}, ${amount}, ${periodStart}, ${periodEnd}, ${currency})
        RETURNING *
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create budget: No rows returned');
      }
      
      // Convert the raw result to our Budget type
      const budget: Budget = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userId as number,
        amount: result.rows[0].amount as string,
        periodStart: result.rows[0].periodStart as string,
        periodEnd: result.rows[0].periodEnd as string,
        currency: result.rows[0].currency as string
      };
      
      return budget;
    } catch (error) {
      console.error('Error in createBudget:', error);
      throw error;
    }
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    if (!db) return undefined;
    try {
      // Process data to match our types
      const processedData: any = {};
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
      
      const result = await db.update(budgets)
        .set(processedData)
        .where(eq(budgets.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in updateBudget:', error);
      return undefined;
    }
  }

  // Transaction operations
  async getTransactions(userId: number): Promise<Transaction[]> {
    if (!db) return [];
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(transactions.timestamp);
      
      return result;
    } catch (error) {
      console.error('Error in getTransactions:', error);
      return [];
    }
  }

  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.hash, hash));
      
      return result[0];
    } catch (error) {
      console.error('Error in getTransactionByHash:', error);
      return undefined;
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    if (!db) throw new Error('Database connection not available');
    try {
      // Extract values
      const userId = insertTransaction.userId;
      const hash = insertTransaction.hash;
      const from = insertTransaction.from;
      const to = insertTransaction.to;
      const amount = insertTransaction.amount.toString();
      const timestamp = new Date(insertTransaction.timestamp).toISOString();
      const currency = insertTransaction.currency;
      const category = insertTransaction.category || null;
      const status = insertTransaction.status;
      const type = insertTransaction.type;
      
      // Use SQL directly to avoid type issues
      const query = sql`
        INSERT INTO transactions ("userId", hash, "from", "to", amount, "timestamp", currency, category, status, type)
        VALUES (${userId}, ${hash}, ${from}, ${to}, ${amount}, ${timestamp}, ${currency}, ${category}, ${status}, ${type})
        RETURNING *
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create transaction: No rows returned');
      }
      
      // Convert the raw result to our Transaction type
      const transaction: Transaction = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userId as number,
        hash: result.rows[0].hash as string,
        from: result.rows[0].from as string,
        to: result.rows[0].to as string,
        amount: result.rows[0].amount as string,
        timestamp: result.rows[0].timestamp as string,
        currency: result.rows[0].currency as string,
        category: result.rows[0].category as string | null,
        status: result.rows[0].status as string,
        type: result.rows[0].type as string
      };
      
      return transaction;
    } catch (error) {
      console.error('Error in createTransaction:', error);
      throw error;
    }
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

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    if (!db) return [];
    try {
      const result = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.timestamp);
      
      return result;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    if (!db) throw new Error('Database connection not available');
    try {
      // Extract values
      const userId = insertNotification.userId;
      const message = insertNotification.message;
      const timestamp = new Date(insertNotification.timestamp).toISOString();
      const read = false;
      
      // Use SQL directly to avoid type issues
      const query = sql`
        INSERT INTO notifications ("userId", message, "timestamp", read)
        VALUES (${userId}, ${message}, ${timestamp}, ${read})
        RETURNING *
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create notification: No rows returned');
      }
      
      // Convert the raw result to our Notification type
      const notification: Notification = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userId as number,
        message: result.rows[0].message as string,
        timestamp: result.rows[0].timestamp as string,
        read: result.rows[0].read as boolean
      };
      
      return notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return undefined;
    }
  }
}