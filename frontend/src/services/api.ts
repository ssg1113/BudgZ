import type {
  IUser,
  ICategory,
  ITransaction,
  IBudget,
  BudgetStatusReport,
  INotification,
  AnalyticsSummary,
  CategoryBreakdownItem,
  TrendPoint
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('budgz_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = data.error;
      if (data.details && Array.isArray(data.details) && data.details.length > 0) {
        errorMsg = data.details.map((d: any) => d.message).join('. ');
      }
      throw new Error(errorMsg || 'An error occurred during request');
    }

    return data as T;
  }

  // Auth
  async register(body: { name: string; email: string; password: string; currency?: string }) {
    return this.request<{ success: boolean; token: string; user: IUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async login(body: { email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: IUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async googleAuth(credential: string) {
    return this.request<{ success: boolean; token: string; user: IUser; message: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: IUser }>('/auth/me');
  }

  async updateProfile(updates: Partial<IUser>) {
    return this.request<{ success: boolean; user: IUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Categories
  async getCategories() {
    return this.request<{ success: boolean; data: ICategory[] }>('/categories');
  }

  async createCategory(body: { name: string; type: 'income' | 'expense'; icon: string; color: string }) {
    return this.request<{ success: boolean; data: ICategory }>('/categories', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateCategory(id: string, body: Partial<ICategory>) {
    return this.request<{ success: boolean; data: ICategory }>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async deleteCategory(id: string, reassignTo?: string) {
    const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : '';
    return this.request<{ success: boolean; message: string }>(`/categories/${id}${query}`, {
      method: 'DELETE'
    });
  }

  // Transactions
  async getTransactions(params?: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: ITransaction[] }>(`/transactions${qStr}`);
  }

  async createTransaction(body: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    description?: string;
    transactionDate: string;
  }) {
    return this.request<{ success: boolean; data: ITransaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateTransaction(id: string, body: Partial<ITransaction>) {
    return this.request<{ success: boolean; data: ITransaction }>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async deleteTransaction(id: string) {
    return this.request<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'DELETE'
    });
  }

  // Budgets
  async getBudgets(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const qStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; data: BudgetStatusReport[] }>(`/budgets${qStr}`);
  }

  async setBudget(body: {
    categoryId?: string | null;
    amount: number;
    month: number;
    year: number;
    warningThreshold?: number;
  }) {
    return this.request<{ success: boolean; data: IBudget }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateBudget(id: string, body: { amount?: number; warningThreshold?: number }) {
    return this.request<{ success: boolean; data: IBudget }>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async deleteBudget(id: string) {
    return this.request<{ success: boolean; message: string }>(`/budgets/${id}`, {
      method: 'DELETE'
    });
  }

  // Analytics
  async getAnalyticsSummary(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const qStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; data: AnalyticsSummary }>(`/analytics/summary${qStr}`);
  }

  async getCategoryBreakdown(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const qStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; totalExpense: number; data: CategoryBreakdownItem[] }>(`/analytics/categories${qStr}`);
  }

  async getSpendingTrends(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const qStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; data: TrendPoint[] }>(`/analytics/trends${qStr}`);
  }

  // Notifications
  async getNotifications() {
    return this.request<{ success: boolean; unreadCount: number; data: INotification[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PATCH'
    });
  }
}

export const api = new ApiService();
