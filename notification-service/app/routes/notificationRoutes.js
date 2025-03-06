import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';

const router = Router();

router.get('/notifications/:userId', notificationController.getUserNotifications.bind(notificationController));
router.patch('/notifications/:notificationId/read', notificationController.markAsRead.bind(notificationController));
router.get('/notifications/:userId/unread-count', notificationController.getUnreadCount.bind(notificationController));

export default router; 