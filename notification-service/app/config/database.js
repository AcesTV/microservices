import { MongoClient } from 'mongodb';

let db = null;

export const connectDB = async () => {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        db = client.db('notification_db');
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}; 