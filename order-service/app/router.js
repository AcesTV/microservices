import express from 'express';
import ordersRoutes from './routes/orders.js';
import { orderController } from './controllers/orderController.js';

const router = express.Router();

// Route racine pour lister toutes les commandes
router.get('/', orderController.list);

// Routes des commandes
router.use('/orders', ordersRoutes);

// 404 handler
router.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

export default router; 