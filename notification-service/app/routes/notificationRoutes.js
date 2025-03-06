import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';

const router = Router();

router.get('/notifications/:userId', notificationController.getUserNotifications);
router.patch('/notifications/:notificationId/read', notificationController.markAsRead);
router.get('/notifications/:userId/unread-count', notificationController.getUnreadCount);

export default router; 