import NotificationService from '../services/notificationService.js';

class NotificationController {
    constructor() {
        this.notificationService = new NotificationService();
    }

    async getUserNotifications(req, res) {
        try {
            const { userId } = req.params;
            const notifications = await this.notificationService.getUserNotifications(userId);
            res.json(notifications);
        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            await this.notificationService.markNotificationAsRead(notificationId);
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const { userId } = req.params;
            const count = await this.notificationService.getUnreadCount(userId);
            res.json({ count });
        } catch (error) {
            console.error('Error in getUnreadCount:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new NotificationController(); 