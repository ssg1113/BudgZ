import { Router, Response } from 'express';
import { z } from 'zod';
import { storage } from '../db/storage';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getBudgetSummaries } from '../services/budgetEngine';

export const budgetRouter = Router();

budgetRouter.use(authenticate);

const budgetSchema = z.object({
  categoryId: z.string().nullable().optional().default(null),
  amount: z.number().positive('Budget amount must be positive'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  warningThreshold: z.number().min(1).max(100).optional().default(80)
});

// GET budgets for selected month/year with utilization calculations
budgetRouter.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const reports = await getBudgetSummaries(req.user!.id, month, year);
    res.json({
      success: true,
      period: { month, year },
      data: reports
    });
  } catch (err) {
    next(err);
  }
});

// POST create or upsert budget
budgetRouter.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = budgetSchema.parse(req.body);

    if (data.categoryId) {
      const cat = await storage.getCategoryById(data.categoryId, req.user!.id);
      if (!cat) {
        res.status(400).json({ success: false, error: 'Category does not exist.' });
        return;
      }
    }

    const budget = await storage.createOrUpdateBudget(req.user!.id, {
      categoryId: data.categoryId ?? null,
      amount: data.amount,
      month: data.month,
      year: data.year,
      warningThreshold: data.warningThreshold
    });

    res.status(201).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
});

// PATCH update budget
budgetRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const updateSchema = z.object({
      amount: z.number().positive().optional(),
      warningThreshold: z.number().min(1).max(100).optional()
    });

    const data = updateSchema.parse(req.body);
    const updated = await storage.updateBudget(String(req.params.id), req.user!.id, data);

    if (!updated) {
      res.status(404).json({ success: false, error: 'Budget not found.' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE budget
budgetRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const deleted = await storage.deleteBudget(String(req.params.id), req.user!.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Budget not found.' });
      return;
    }

    res.json({ success: true, message: 'Budget deleted successfully.' });
  } catch (err) {
    next(err);
  }
});
