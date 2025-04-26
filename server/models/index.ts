import mongoose, { Schema, Document } from 'mongoose';

// User model
export interface IUser extends Document {
  username: string;
  password: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const User = mongoose.model<IUser>('User', UserSchema);

// Budget model
export interface IBudget extends Document {
  userId: number;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
}

const BudgetSchema: Schema = new Schema({
  userId: { type: Number, required: true },
  amount: { type: Number, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  currency: { type: String, required: true },
});

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

// Transaction model
export interface ITransaction extends Document {
  userId: number;
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  currency: string;
  category?: string;
  status: string;
  type: string;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Number, required: true },
  hash: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  currency: { type: String, required: true },
  category: { type: String },
  status: { type: String, required: true },
  type: { type: String, required: true },
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

// Notification model
export interface INotification extends Document {
  userId: number;
  message: string;
  read: boolean;
  timestamp: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Number, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);