import { Router, Response } from 'express';
import { z } from 'zod';
import { storage } from '../db/storage';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { evaluateBudgetAlerts } from '../services/budgetEngine';

export const transactionRouter = Router();

transactionRouter.use(authenticate);

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than zero'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().max(200, 'Description max 200 characters').optional().default(''),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Transaction date must be YYYY-MM-DD format')
});

// GET transactions with filters
transactionRouter.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const txs = await storage.getTransactions(req.user!.id, {
      type: type as string | undefined,
      categoryId: categoryId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: (sortOrder === 'asc' ? 'asc' : 'desc')
    });

    res.json({ success: true, count: txs.length, data: txs });
  } catch (err) {
    next(err);
  }
});

// GET single transaction
transactionRouter.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tx = await storage.getTransactionById(String(req.params.id), req.user!.id);
    if (!tx) {
      res.status(404).json({ success: false, error: 'Transaction not found.' });
      return;
    }
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
});

// POST create transaction
transactionRouter.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = transactionSchema.parse(req.body);

    // Verify category belongs to user or is default
    const cat = await storage.getCategoryById(data.categoryId, req.user!.id);
    if (!cat) {
      res.status(400).json({ success: false, error: 'Invalid category selected.' });
      return;
    }

    const tx = await storage.createTransaction(req.user!.id, data);

    // Trigger budget alert check for expense transactions
    if (tx.type === 'expense') {
      evaluateBudgetAlerts(req.user!.id, tx.transactionDate).catch(e =>
        console.error('[BudgetAlertError]', e)
      );
    }

    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
});

// PATCH update transaction
transactionRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = transactionSchema.partial().parse(req.body);

    if (data.categoryId) {
      const cat = await storage.getCategoryById(data.categoryId, req.user!.id);
      if (!cat) {
        res.status(400).json({ success: false, error: 'Invalid category selected.' });
        return;
      }
    }

    const updated = await storage.updateTransaction(String(req.params.id), req.user!.id, data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Transaction not found.' });
      return;
    }

    // Trigger budget check
    evaluateBudgetAlerts(req.user!.id, updated.transactionDate).catch(e =>
      console.error('[BudgetAlertError]', e)
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE transaction
transactionRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const txId = String(req.params.id);
    const existing = await storage.getTransactionById(txId, req.user!.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Transaction not found.' });
      return;
    }

    await storage.deleteTransaction(txId, req.user!.id);

    // Re-evaluate budget status
    evaluateBudgetAlerts(req.user!.id, existing.transactionDate).catch(e =>
      console.error('[BudgetAlertError]', e)
    );

    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (err) {
    next(err);
  }
});
