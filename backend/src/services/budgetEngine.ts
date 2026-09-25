import { storage } from '../db/storage';
import { IBudget } from '../types';

export interface BudgetStatusReport {
  budget: IBudget;
  spent: number;
  remaining: number;
  utilization: number; // percentage
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED';
  categoryName?: string;
}

export async function getBudgetSummaries(userId: string, month: number, year: number): Promise<BudgetStatusReport[]> {
  const budgets = await storage.getBudgets(userId, month, year);
  const categories = await storage.getCategories(userId);
  const catMap = new Map<string, string>();
  categories.forEach(c => catMap.set(c.id, c.name));

  // Period date boundaries
  const startMonthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${startMonthStr}-01`;
  // calculate last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${startMonthStr}-${String(lastDay).padStart(2, '0')}`;

  const transactions = await storage.getTransactions(userId, {
    type: 'expense',
    startDate,
    endDate
  });

  const reports: BudgetStatusReport[] = [];

  for (const b of budgets) {
    let spent = 0;
    if (b.categoryId === null) {
      // Overall monthly budget covers all expenses
      spent = transactions.reduce((acc, t) => acc + t.amount, 0);
    } else {
      // Category budget covers matching category expenses
      spent = transactions
        .filter(t => t.categoryId === b.categoryId)
        .reduce((acc, t) => acc + t.amount, 0);
    }

    const utilization = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const warningThreshold = b.warningThreshold || 80;
    let status: 'NORMAL' | 'WARNING' | 'EXCEEDED' = 'NORMAL';

    if (utilization > 100) {
      status = 'EXCEEDED';
    } else if (utilization >= warningThreshold) {
      status = 'WARNING';
    }

    reports.push({
      budget: b,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round((b.amount - spent) * 100) / 100,
      utilization: Math.round(utilization * 10) / 10,
      status,
      categoryName: b.categoryId ? catMap.get(b.categoryId) || 'Category' : 'Overall Monthly Budget'
    });
  }

  return reports;
}

export async function evaluateBudgetAlerts(userId: string, transactionDateStr: string): Promise<void> {
  const d = new Date(transactionDateStr);
  if (isNaN(d.getTime())) return;

  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const period = `${year}-${String(month).padStart(2, '0')}`;

  const reports = await getBudgetSummaries(userId, month, year);

  for (const r of reports) {
    const { budget, utilization, status, categoryName, spent } = r;

    // Check near limit (80% or custom threshold)
    if (status === 'WARNING' || status === 'EXCEEDED') {
      const isExceeded = status === 'EXCEEDED';
      const thresholdToCheck = isExceeded ? 100 : (budget.warningThreshold || 80);
      const notifType = isExceeded ? 'EXCEEDED' : 'NEAR_LIMIT';

      // Deduplication check (BR-08)
      const existing = await storage.findNotification(userId, budget.id, period, thresholdToCheck);
      if (!existing) {
        const title = categoryName || 'Budget';
        const message = isExceeded
          ? `Budget Alert: Your "${title}" budget of ${budget.amount} has been exceeded! Total spent: ${spent} (${utilization}%).`
          : `Budget Warning: You have reached ${utilization}% of your "${title}" budget (${spent}/${budget.amount}).`;

        await storage.createNotification({
          userId,
          type: notifType,
          budgetId: budget.id,
          period,
          threshold: thresholdToCheck,
          message,
          read: false
        });
      }
    }
  }
}
