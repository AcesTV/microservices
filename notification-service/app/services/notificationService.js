import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

class NotificationService {
    constructor() {
        this.db = null;
    }

    async initialize() {
        this.db = getDatabase();
        // Ensure the notifications collection exists with proper indexes
        await this.db.collection('notifications').createIndex({ userId: 1 });
        await this.db.collection('notifications').createIndex({ createdAt: -1 });
    }

    ensureInitialized() {
        if (!this.db) {
            throw new Error('NotificationService not initialized');
        }
    }

    async getUserNotifications(userId) {
        this.ensureInitialized();
        return await this.db.collection('notifications')
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async markNotificationAsRead(notificationId) {
        this.ensureInitialized();
        return await this.db.collection('notifications').updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: { isRead: true } }
        );
    }

    async getUnreadCount(userId) {
        this.ensureInitialized();
        return await this.db.collection('notifications').countDocuments({
            userId,
            isRead: false
        });
    }

    async createNotification(orderData) {
        this.ensureInitialized();
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