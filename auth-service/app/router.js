import express from "express";
import authRouter from './routes/auth.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

router.use('/', authRouter);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

export default router;
