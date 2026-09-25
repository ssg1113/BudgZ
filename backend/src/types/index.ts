export type TransactionType = 'income' | 'expense';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  authProvider?: 'local' | 'google';
  currency: string;
  preferences: {
    notificationThreshold: number;
    browserNotificationsEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  id: string;
  userId: string | null; // null for system default
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ITransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  transactionDate: string; // ISO format (YYYY-MM-DD or full timestamp)
  createdAt: string;
  updatedAt: string;
}

export interface IBudget {
  id: string;
  userId: string;
  categoryId: string | null; // null for overall monthly budget
  amount: number;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  warningThreshold: number; // default 80
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'NEAR_LIMIT' | 'EXCEEDED';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  budgetId: string;
  period: string; // "YYYY-MM"
  threshold: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  currency: string;
}
