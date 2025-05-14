import { Schema, model, Document, Types } from 'mongoose';

// ============================
// User Schema
// ============================

export interface IUser extends Document {
  username: string;
  email: string;
  metaMaskAddress: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  preferences: {
    currency: string;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    metaMaskAddress: { type: String, required: true, unique: true },
    lastLogin: { type: Date },
    preferences: {
      currency: { type: String, default: 'ETH' },
      notifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============================
// Transaction Schema
// ============================

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  txHash: string;
  amount: number;
  timestamp: Date;
  transactionType: 'sent' | 'received';
  status: 'pending' | 'completed' | 'failed';
  fromAddress: string;
  toAddress: string;
  currency: string;
  category?: string;
  gasUsed?: number;
  gasPrice?: number;
  networkFee?: number;
  notes?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    txHash: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
    transactionType: { type: String, required: true, enum: ['sent', 'received'] },
    status: { type: String, required: true, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
    fromAddress: { type: String, required: true, index: true },
    toAddress: { type: String, required: true, index: true },
    currency: { type: String, required: true, default: 'ETH' },
    category: { type: String, index: true },
    gasUsed: { type: Number },
    gasPrice: { type: Number },
    networkFee: { type: Number },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

// ============================
// Budget Schema
// ============================

export interface IBudget extends Document {
  userId: Types.ObjectId;
  amount: number;
  spent: number;
  remaining: number;
  warnThreshold: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  categories: Array<{
    name: string;
    limit: number;
    spent: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    remaining: { type: Number },
    warnThreshold: { type: Number, required: true, default: 80 },
    currency: { type: String, required: true, default: 'ETH' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    categories: [{
      name: { type: String, required: true },
      limit: { type: Number, required: true },
      spent: { type: Number, default: 0 }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

budgetSchema.pre('save', function(next) {
  this.remaining = this.amount - this.spent;
  next();
});

// ============================
// Report Schema
// ============================

export interface IReport extends Document {
  userId: Types.ObjectId;
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  title: string;
  description?: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  reportData: {
    totalTransactions: number;
    totalSent: number;
    totalReceived: number;
    netBalance: number;
    transactionsByCategory: Record<string, number>;
    dailyVolume: Array<{
      date: Date;
      volume: number;
    }>;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
}

const reportSchema = new Schema<IReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'] },
  title: { type: String, required: true },
  description: { type: String },
  generatedAt: { type: Date, required: true, default: Date.now },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  reportData: {
    totalTransactions: { type: Number, required: true },
    totalSent: { type: Number, required: true },
    totalReceived: { type: Number, required: true },
    netBalance: { type: Number, required: true },
    transactionsByCategory: { type: Map, of: Number },
    dailyVolume: [{
      date: { type: Date, required: true },
      volume: { type: Number, required: true }
    }],
    topCategories: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true },
      percentage: { type: Number, required: true }
    }]
  }
});

// ============================
// Notification Schema
// ============================

export interface INotification extends Document {
  userId: Types.ObjectId;
  notificationType: 'budget_warning' | 'transaction_completed' | 'system';
  message: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'read';
  metadata?: Record<string, any>;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notificationType: { type: String, required: true, enum: ['budget_warning', 'transaction_completed', 'system'] },
  message: { type: String, required: true },
  sentAt: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
  metadata: { type: Map, of: Schema.Types.Mixed }
});

// ============================
// Indexes
// ============================

transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ txHash: 1 }, { unique: true });
budgetSchema.index({ userId: 1, periodStart: 1, periodEnd: 1 });
reportSchema.index({ userId: 1, generatedAt: -1 });
notificationSchema.index({ userId: 1, sentAt: -1 });

// ============================
// Export Models
// ============================

export const User = model<IUser>('User', userSchema);
export const Transaction = model<ITransaction>('Transaction', transactionSchema);
export const Budget = model<IBudget>('Budget', budgetSchema);
export const Report = model<IReport>('Report', reportSchema);
export const Notification = model<INotification>('Notification', notificationSchema);
