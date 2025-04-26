export interface User {
  id: number;
  username: string;
}

export interface Budget {
  id: number;
  userId: number;
  amount: number;
  periodStart: string;
  periodEnd: string;
  currency: string;
}

export interface Transaction {
  id: number;
  userId: number;
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  currency: string;
  category?: string;
  status: string;
  type: string;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface BudgetFormData {
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
}

export interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  error: string | null;
}

export interface TransactionsByDay {
  day: string;
  amount: number;
}

export interface SpendingByCategory {
  name: string;
  value: number;
  color: string;
}

// Default user ID until we implement authentication
export const DEFAULT_USER_ID = 1;
