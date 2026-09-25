import { Router, Response } from 'express';
import { storage } from '../db/storage';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// GET notifications
notificationRouter.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notifications = await storage.getNotifications(req.user!.id);
    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
});

// PATCH mark single notification as read
notificationRouter.patch('/:id/read', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const success = await storage.markNotificationRead(String(req.params.id), req.user!.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});

// PATCH mark all as read
notificationRouter.patch('/read-all', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const count = await storage.markAllNotificationsRead(req.user!.id);
    res.json({ success: true, message: `Marked ${count} notifications as read.` });
  } catch (err) {
    next(err);
  }
});
