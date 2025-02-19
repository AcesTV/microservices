import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth Route:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// Routes publiques
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);
router.post('/refresh', authController.refresh);

// Routes protégées
router.get('/verify', authMiddleware, authController.verify);
router.get('/me', authMiddleware, authController.me);

export default router;