import express from "express";
import router from "./router.js";
import cors from 'cors';
import morgan from 'morgan';
import { MessagingService } from '@myapp/shared';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const startServer = async () => {
    try {
        const messagingService = new MessagingService();
        
        app.listen(port, () => {
            console.log(`Auth service is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Gérer la fermeture propre
process.on('SIGTERM', async () => {
    process.exit(0);
});