import { Router, Response } from 'express';
import { z } from 'zod';
import { storage } from '../db/storage';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const categoryRouter = Router();

categoryRouter.use(authenticate);

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().default('Tag'),
  color: z.string().default('#6366f1')
});

// GET all categories (default + user custom)
categoryRouter.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const categories = await storage.getCategories(req.user!.id);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// POST create custom category
categoryRouter.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await storage.createCategory(req.user!.id, data);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

// PATCH update custom category
categoryRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const updated = await storage.updateCategory(String(req.params.id), req.user!.id, data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Custom category not found or cannot be modified.' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE custom category (FR-CAT-04: safe deletion with transaction check/reassignment)
categoryRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const categoryId = String(req.params.id);
    const category = await storage.getCategoryById(categoryId, req.user!.id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found.' });
      return;
    }

    if (category.isDefault) {
      res.status(400).json({ success: false, error: 'System default categories cannot be deleted.' });
      return;
    }

    const txCount = await storage.countTransactionsByCategoryId(categoryId, req.user!.id);
    const reassignTo = req.query.reassignTo as string;

    if (txCount > 0 && !reassignTo) {
      res.status(400).json({
        success: false,
        error: `Category is used by ${txCount} transaction(s). Please specify 'reassignTo' category id to safely reassign them.`,
        transactionCount: txCount
      });
      return;
    }

    if (txCount > 0 && reassignTo) {
      await storage.reassignTransactionsCategory(categoryId, reassignTo, req.user!.id);
    }

    const deleted = await storage.deleteCategory(categoryId, req.user!.id);
    res.json({ success: true, message: 'Category deleted successfully', deleted });
  } catch (err) {
    next(err);
  }
});
