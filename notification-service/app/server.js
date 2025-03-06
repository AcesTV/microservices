import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import notificationRoutes from './routes/notificationRoutes.js';
import Consumer from './messaging/consumer.js';

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', notificationRoutes);

// Start server
const startServer = async () => {
    // Connect to MongoDB
    await connectDB();
    
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
};

startServer().catch(console.error);
