import express, { Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { categoryRouter } from './routes/category.routes';
import { transactionRouter } from './routes/transaction.routes';
import { budgetRouter } from './routes/budget.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { notificationRouter } from './routes/notification.routes';
import { errorHandler } from './middleware/errorHandler';
import { storage } from './db/storage';

export const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow frontend dev server on any port
  credentials: true
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'BudgZ API Server',
    database: storage.isMongoConnected ? 'mongodb' : 'file_storage (persistent JSON)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);
