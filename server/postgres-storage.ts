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
      // Use SQL directly to avoid column name issues
      const query = sql`
        SELECT * FROM budgets WHERE "userid" = ${userId}
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert the raw result to our Budget type
      const budget: Budget = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userid as number,
        amount: result.rows[0].amount as string,
        periodStart: result.rows[0].periodStart as string,
        periodEnd: result.rows[0].periodEnd as string,
        currency: result.rows[0].currency as string
      };
      
      return budget;
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
        INSERT INTO budgets (userid, amount, "periodstart", "periodend", currency)
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
        userId: result.rows[0].userid as number,
        amount: result.rows[0].amount as string,
        periodStart: result.rows[0].periodstart as string,
        periodEnd: result.rows[0].periodend as string,
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
      // Build the SET clause for our update query
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      if (budgetData.amount !== undefined) {
        setClauses.push(`amount = $${paramIndex}`);
        values.push(budgetData.amount.toString());
        paramIndex++;
      }
      
      if (budgetData.periodStart !== undefined) {
        setClauses.push(`periodstart = $${paramIndex}`);
        values.push(new Date(budgetData.periodStart).toISOString());
        paramIndex++;
      }
      
      if (budgetData.periodEnd !== undefined) {
        setClauses.push(`periodend = $${paramIndex}`);
        values.push(new Date(budgetData.periodEnd).toISOString());
        paramIndex++;
      }
      
      if (budgetData.currency !== undefined) {
        setClauses.push(`currency = $${paramIndex}`);
        values.push(budgetData.currency);
        paramIndex++;
      }
      
      if (budgetData.userId !== undefined) {
        setClauses.push(`userid = $${paramIndex}`);
        values.push(budgetData.userId);
        paramIndex++;
      }
      
      if (setClauses.length === 0) {
        return undefined; // Nothing to update
      }
      
      // Add the id at the end for the WHERE clause
      values.push(id);
      
      // Construct the query
      const queryText = `
        UPDATE budgets 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await db.execute({
        text: queryText,
        values: values
      });
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert the raw result to our Budget type
      const budget: Budget = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userid as number,
        amount: result.rows[0].amount as string,
        periodStart: result.rows[0].periodstart as string,
        periodEnd: result.rows[0].periodend as string,
        currency: result.rows[0].currency as string
      };
      
      return budget;
    } catch (error) {
      console.error('Error in updateBudget:', error);
      return undefined;
    }
  }

  // Transaction operations
  async getTransactions(userId: number): Promise<Transaction[]> {
    if (!db) return [];
    try {
      // Use SQL directly to avoid column name issues
      const query = sql`
        SELECT * FROM transactions WHERE userid = ${userId}
        ORDER BY timestamp
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows) {
        return [];
      }
      
      // Convert the raw results to our Transaction type
      const transactions: Transaction[] = result.rows.map(row => ({
        id: row.id as number,
        userId: row.userid as number,
        hash: row.hash as string,
        from: row.from as string,
        to: row.to as string,
        amount: row.amount as string,
        timestamp: row.timestamp as string,
        currency: row.currency as string,
        category: row.category as string | null,
        status: row.status as string,
        type: row.type as string
      }));
      
      return transactions;
    } catch (error) {
      console.error('Error in getTransactions:', error);
      return [];
    }
  }

  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    if (!db) return undefined;
    try {
      // Use SQL directly to avoid column name issues
      const query = sql`
        SELECT * FROM transactions WHERE hash = ${hash}
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert the raw result to our Transaction type
      const transaction: Transaction = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userid as number,
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
        INSERT INTO transactions (userid, hash, "from", "to", amount, timestamp, currency, category, status, type)
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
        userId: result.rows[0].userid as number,
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
      // Use SQL directly to avoid column name issues
      const query = sql`
        SELECT * FROM notifications WHERE userid = ${userId}
        ORDER BY timestamp
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows) {
        return [];
      }
      
      // Convert the raw results to our Notification type
      const notifications: Notification[] = result.rows.map(row => ({
        id: row.id as number,
        userId: row.userid as number,
        message: row.message as string,
        timestamp: row.timestamp as string,
        read: row.read as boolean
      }));
      
      return notifications;
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
        INSERT INTO notifications (userid, message, timestamp, read)
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
        userId: result.rows[0].userid as number,
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
      // Use SQL directly to avoid column name issues
      const query = sql`
        UPDATE notifications 
        SET read = true 
        WHERE id = ${id}
        RETURNING *
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Convert the raw result to our Notification type
      const notification: Notification = {
        id: result.rows[0].id as number,
        userId: result.rows[0].userid as number,
        message: result.rows[0].message as string,
        timestamp: result.rows[0].timestamp as string,
        read: result.rows[0].read as boolean
      };
      
      return notification;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return undefined;
    }
  }
}