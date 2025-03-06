import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

class NotificationService {
    constructor() {
        this.db = getDatabase();
    }

    async getUserNotifications(userId) {
        return await this.db.collection('notifications')
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async markNotificationAsRead(notificationId) {
        return await this.db.collection('notifications').updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: { isRead: true } }
        );
    }

    async getUnreadCount(userId) {
        return await this.db.collection('notifications').countDocuments({
            userId,
            isRead: false
        });
    }

    async createNotification(orderData) {
        return await this.db.collection('notifications').insertOne({
            orderId: orderData.orderId,
            userId: orderData.userId,
            status: orderData.status,
            message: `Your order #${orderData.orderId} status has been updated to: ${orderData.status}`,
            createdAt: new Date(),
            isRead: false
        });
    }
}

export default NotificationService; 