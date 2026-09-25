export type TransactionType = 'income' | 'expense';

export interface IUser {
  id: string;
  name: string;
  email: string;
  currency: string;
  avatar?: string;
  authProvider?: 'local' | 'google';
  preferences: {
    notificationThreshold: number;
    browserNotificationsEnabled: boolean;
  };
}

export interface ICategory {
  id: string;
  userId: string | null;
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
  transactionDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface IBudget {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  month: number;
  year: number;
  warningThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatusReport {
  budget: IBudget;
  spent: number;
  remaining: number;
  utilization: number;
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED';
  categoryName?: string;
}

export type NotificationType = 'NEAR_LIMIT' | 'EXCEEDED';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  budgetId: string;
  period: string;
  threshold: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  period: { month: number; year: number };
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  highestExpenseCategory: {
    id: string;
    name: string;
    amount: number;
  };
  overallBudget: {
    set: boolean;
    amount: number;
    spent: number;
    remaining: number;
    utilization: number;
  };
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface TrendPoint {
  date: string;
  day: number;
  income: number;
  expense: number;
}
