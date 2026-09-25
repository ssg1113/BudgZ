import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  ICategory,
  ITransaction,
  BudgetStatusReport,
  INotification,
  AnalyticsSummary,
  CategoryBreakdownItem,
  TrendPoint
} from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  categories: ICategory[];
  transactions: ITransaction[];
  budgets: BudgetStatusReport[];
  summary: AnalyticsSummary | null;
  categoryBreakdown: CategoryBreakdownItem[];
  spendingTrends: TrendPoint[];
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatusReport[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<TrendPoint[]>([]);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [
        catsRes,
        txsRes,
        budgetsRes,
        summaryRes,
        breakdownRes,
        trendsRes,
        notifsRes
      ] = await Promise.all([
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(selectedMonth, selectedYear),
        api.getAnalyticsSummary(selectedMonth, selectedYear),
        api.getCategoryBreakdown(selectedMonth, selectedYear),
        api.getSpendingTrends(selectedMonth, selectedYear),
        api.getNotifications()
      ]);

      setCategories(catsRes.data || []);
      setTransactions(txsRes.data || []);
      setBudgets(budgetsRes.data || []);
      setSummary(summaryRes.data || null);
      setCategoryBreakdown(breakdownRes.data || []);
      setSpendingTrends(trendsRes.data || []);
      setNotifications(notifsRes.data || []);
      setUnreadCount(notifsRes.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <FinanceContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        categories,
        transactions,
        budgets,
        summary,
        categoryBreakdown,
        spendingTrends,
        notifications,
        unreadCount,
        isLoading,
        refreshData,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
