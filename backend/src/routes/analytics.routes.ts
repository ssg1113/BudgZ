import { Router, Response } from 'express';
import { storage } from '../db/storage';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// Helper for date bounds
function getMonthBounds(month: number, year: number) {
  const startMonthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${startMonthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${startMonthStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

// GET summary metrics
analyticsRouter.get('/summary', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const { startDate, endDate } = getMonthBounds(month, year);

    const txs = await storage.getTransactions(req.user!.id, { startDate, endDate });
    const categories = await storage.getCategories(req.user!.id);
    const catMap = new Map(categories.map(c => [c.id, c.name]));

    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseByCat: Record<string, number> = {};

    txs.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        expenseByCat[t.categoryId] = (expenseByCat[t.categoryId] || 0) + t.amount;
      }
    });

    const netBalance = totalIncome - totalExpenses;

    // Highest expense category
    let highestCategory = { id: '', name: 'None', amount: 0 };
    for (const [catId, amt] of Object.entries(expenseByCat)) {
      if (amt > highestCategory.amount) {
        highestCategory = {
          id: catId,
          name: catMap.get(catId) || 'Uncategorized',
          amount: amt
        };
      }
    }

    // Overall budget for month
    const budgets = await storage.getBudgets(req.user!.id, month, year);
    const overallBudget = budgets.find(b => b.categoryId === null);
    const overallBudgetAmount = overallBudget ? overallBudget.amount : 0;
    const overallBudgetRemaining = overallBudget ? Math.max(0, overallBudget.amount - totalExpenses) : 0;
    const overallBudgetUtilization = overallBudgetAmount > 0 ? (totalExpenses / overallBudgetAmount) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: { month, year },
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
        highestExpenseCategory: highestCategory,
        overallBudget: {
          set: !!overallBudget,
          amount: overallBudgetAmount,
          spent: totalExpenses,
          remaining: overallBudgetRemaining,
          utilization: Math.round(overallBudgetUtilization * 10) / 10
        },
        transactionCount: txs.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET category breakdown for charts (Pie/Doughnut)
analyticsRouter.get('/categories', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const { startDate, endDate } = getMonthBounds(month, year);

    const txs = await storage.getTransactions(req.user!.id, {
      type: 'expense',
      startDate,
      endDate
    });

    const categories = await storage.getCategories(req.user!.id);
    const catMap = new Map(categories.map(c => [c.id, c]));

    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    txs.forEach(t => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      totalExpense += t.amount;
    });

    const breakdown = Object.entries(categoryTotals).map(([catId, amount]) => {
      const cat = catMap.get(catId);
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0;
      return {
        categoryId: catId,
        name: cat ? cat.name : 'Other',
        color: cat ? cat.color : '#94a3b8',
        icon: cat ? cat.icon : 'Tag',
        amount: Math.round(amount * 100) / 100,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      period: { month, year },
      totalExpense: Math.round(totalExpense * 100) / 100,
      data: breakdown
    });
  } catch (err) {
    next(err);
  }
});

// GET spending trends (daily timeline)
analyticsRouter.get('/trends', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const { startDate, endDate } = getMonthBounds(month, year);

    const txs = await storage.getTransactions(req.user!.id, { startDate, endDate });

    // Group by day
    const lastDay = new Date(year, month, 0).getDate();
    const dailyMap: Record<string, { income: number; expense: number }> = {};

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyMap[dateStr] = { income: 0, expense: 0 };
    }

    txs.forEach(t => {
      const dateKey = t.transactionDate.substring(0, 10);
      if (dailyMap[dateKey]) {
        if (t.type === 'income') {
          dailyMap[dateKey].income += t.amount;
        } else {
          dailyMap[dateKey].expense += t.amount;
        }
      }
    });

    const timeline = Object.entries(dailyMap).map(([date, values]) => ({
      date,
      day: parseInt(date.split('-')[2], 10),
      income: values.income,
      expense: values.expense
    }));

    res.json({
      success: true,
      period: { month, year },
      data: timeline
    });
  } catch (err) {
    next(err);
  }
});
