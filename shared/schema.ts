import { pgTable, text, serial, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  currency: text("currency").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hash: text("hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  amount: numeric("amount").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  currency: text("currency").notNull(),
  category: text("category"),
  status: text("status").notNull(),
  type: text("type").notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBudgetSchema = z.object({
  userId: z.number(),
  amount: z.string(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  currency: z.string()
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  hash: true,
  from: true,
  to: true,
  amount: true,
  timestamp: true,
  currency: true,
  category: true,
  status: true,
  type: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  message: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
// Make string|number to support both PostgreSQL and MongoDB
export type User = {
  id: number;
  username: string;
  password: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    currency: string;
  };
};

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
// Define a type compatible with both PostgreSQL and MongoDB
export type Budget = {
  id: number;
  userId: number;
  amount: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
};

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
// Define a type compatible with both PostgreSQL and MongoDB
export type Transaction = {
  id: number;
  userId: number;
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  currency: string;
  category: string | null;
  status: string;
  type: string;
};

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
// Define a type compatible with both PostgreSQL and MongoDB
export type Notification = {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  timestamp: string;
};
