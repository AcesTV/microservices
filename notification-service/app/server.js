import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/database.js';
import notificationRoutes from './routes/notificationRoutes.js';
import Consumer from './messaging/consumer.js';

const app = express();
const port = process.env.PORT || 8004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', notificationRoutes);

// Start server
const startServer = async () => {
    try {
        mongoose.connect(config.url, config.options);
        
        // Start RabbitMQ consumer
        const consumer = new Consumer();
        await consumer.startConsuming();

        // Start Express server
        app.listen(port, () => {
            console.log(`Notification service listening on port ${port}`);
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            await consumer.close();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

startServer().catch(console.error);
