import { ICategory } from '../types';

export const defaultCategories: Omit<ICategory, 'id' | 'createdAt'>[] = [
  // Income
  {
    userId: null,
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    isDefault: true
  },
  {
    userId: null,
    name: 'Freelance & Investments',
    type: 'income',
    icon: 'TrendingUp',
    color: '#06b6d4',
    isDefault: true
  },
  {
    userId: null,
    name: 'Other Income',
    type: 'income',
    icon: 'PlusCircle',
    color: '#6366f1',
    isDefault: true
  },
  // Expense
  {
    userId: null,
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#f59e0b',
    isDefault: true
  },
  {
    userId: null,
    name: 'Transport',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6',
    isDefault: true
  },
  {
    userId: null,
    name: 'Education',
    type: 'expense',
    icon: 'BookOpen',
    color: '#8b5cf6',
    isDefault: true
  },
  {
    userId: null,
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#ec4899',
    isDefault: true
  },
  {
    userId: null,
    name: 'Bills & Utilities',
    type: 'expense',
    icon: 'Receipt',
    color: '#ef4444',
    isDefault: true
  },
  {
    userId: null,
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#a855f7',
    isDefault: true
  },
  {
    userId: null,
    name: 'Health & Medical',
    type: 'expense',
    icon: 'Activity',
    color: '#14b8a6',
    isDefault: true
  },
  {
    userId: null,
    name: 'Other',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748b',
    isDefault: true
  }
];
