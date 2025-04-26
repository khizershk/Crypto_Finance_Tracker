import { IStorage } from './storage';
import { User, Budget, Transaction, Notification, IUser, IBudget, ITransaction, INotification } from './models';
import mongoose from 'mongoose';
import { 
  InsertUser, User as UserType,
  InsertBudget, Budget as BudgetType,
  InsertTransaction, Transaction as TransactionType,
  InsertNotification, Notification as NotificationType
} from '@shared/schema';

// MongoDB-based implementation of the storage interface
export class MongoDBStorage implements IStorage {
  // Helper method to convert MongoDB documents to our schema types
  private convertUser(user: IUser): UserType {
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password
    };
  }

  private convertBudget(budget: IBudget): BudgetType {
    return {
      id: budget._id.toString(),
      userId: parseInt(budget.userId.toString(), 10),
      amount: budget.amount.toString(),
      periodStart: budget.periodStart.toISOString(),
      periodEnd: budget.periodEnd.toISOString(),
      currency: budget.currency
    };
  }

  private convertTransaction(transaction: ITransaction): TransactionType {
    return {
      id: transaction._id.toString(),
      userId: parseInt(transaction.userId.toString(), 10),
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount.toString(),
      timestamp: transaction.timestamp.toISOString(),
      currency: transaction.currency,
      category: transaction.category || null,
      status: transaction.status,
      type: transaction.type
    };
  }

  private convertNotification(notification: INotification): NotificationType {
    return {
      id: notification._id.toString(),
      userId: parseInt(notification.userId.toString(), 10),
      message: notification.message,
      read: notification.read,
      timestamp: notification.timestamp.toISOString()
    };
  }

  // User operations
  async getUser(id: number): Promise<UserType | undefined> {
    try {
      // For now, we're using numeric IDs for compatibility
      // Find the user with the lowest ID to simulate this
      const user = await User.findOne({}).sort({ _id: 1 }).skip(id - 1);
      return user ? this.convertUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? this.convertUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<UserType> {
    try {
      const user = new User(insertUser);
      await user.save();
      return this.convertUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Budget operations
  async getBudget(userId: number): Promise<BudgetType | undefined> {
    try {
      // Find the user first to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(userId - 1);
      if (!user) return undefined;

      const budget = await Budget.findOne({ userId: user._id });
      return budget ? this.convertBudget(budget) : undefined;
    } catch (error) {
      console.error('Error getting budget:', error);
      return undefined;
    }
  }

  async createBudget(budget: InsertBudget): Promise<BudgetType> {
    try {
      // Find the user to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(budget.userId - 1);
      if (!user) {
        throw new Error('User not found');
      }

      const newBudget = new Budget({
        ...budget,
        userId: user._id,
        periodStart: new Date(budget.periodStart),
        periodEnd: new Date(budget.periodEnd)
      });
      
      await newBudget.save();
      return this.convertBudget(newBudget);
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<BudgetType | undefined> {
    try {
      // For dates, convert strings to Date objects
      const updateData: any = { ...budgetData };
      if (updateData.periodStart) {
        updateData.periodStart = new Date(updateData.periodStart);
      }
      if (updateData.periodEnd) {
        updateData.periodEnd = new Date(updateData.periodEnd);
      }

      // Find the budget by ID
      const budget = await Budget.findById(id);
      if (!budget) return undefined;

      // Update fields
      Object.assign(budget, updateData);
      await budget.save();
      
      return this.convertBudget(budget);
    } catch (error) {
      console.error('Error updating budget:', error);
      return undefined;
    }
  }

  // Transaction operations
  async getTransactions(userId: number): Promise<TransactionType[]> {
    try {
      // Find the user first to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(userId - 1);
      if (!user) return [];

      const transactions = await Transaction.find({ userId: user._id })
        .sort({ timestamp: -1 });
      
      return transactions.map(tx => this.convertTransaction(tx));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async getTransactionByHash(hash: string): Promise<TransactionType | undefined> {
    try {
      const transaction = await Transaction.findOne({ hash });
      return transaction ? this.convertTransaction(transaction) : undefined;
    } catch (error) {
      console.error('Error getting transaction by hash:', error);
      return undefined;
    }
  }

  async createTransaction(transactionData: InsertTransaction): Promise<TransactionType> {
    try {
      // Find the user to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(transactionData.userId - 1);
      if (!user) {
        throw new Error('User not found');
      }

      const transaction = new Transaction({
        ...transactionData,
        userId: user._id,
        timestamp: new Date(transactionData.timestamp),
        amount: parseFloat(transactionData.amount.toString()),
        category: transactionData.category || null
      });
      
      await transaction.save();
      return this.convertTransaction(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getCategorizedTransactions(userId: number): Promise<Record<string, TransactionType[]>> {
    try {
      const transactions = await this.getTransactions(userId);
      
      return transactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(transaction);
        return acc;
      }, {} as Record<string, TransactionType[]>);
    } catch (error) {
      console.error('Error getting categorized transactions:', error);
      return {};
    }
  }

  // Notification operations
  async getNotifications(userId: number): Promise<NotificationType[]> {
    try {
      // Find the user first to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(userId - 1);
      if (!user) return [];

      const notifications = await Notification.find({ userId: user._id })
        .sort({ timestamp: -1 });
      
      return notifications.map(notification => this.convertNotification(notification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async createNotification(notificationData: InsertNotification): Promise<NotificationType> {
    try {
      // Find the user to get MongoDB ObjectId
      const user = await User.findOne({}).sort({ _id: 1 }).skip(notificationData.userId - 1);
      if (!user) {
        throw new Error('User not found');
      }

      const notification = new Notification({
        ...notificationData,
        userId: user._id,
        timestamp: new Date(notificationData.timestamp),
        read: false
      });
      
      await notification.save();
      return this.convertNotification(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<NotificationType | undefined> {
    try {
      const notification = await Notification.findById(id);
      if (!notification) return undefined;

      notification.read = true;
      await notification.save();
      
      return this.convertNotification(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return undefined;
    }
  }
}