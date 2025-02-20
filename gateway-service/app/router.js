import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middlewares/authMiddleware.js';

const router = express.Router();

// Configuration commune pour les proxies
const createServiceProxy = (target, pathRewrite) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        logLevel: 'debug',
        // Configuration pour gérer tous les types de requêtes
        onProxyReq: (proxyReq, req, res) => {
            // Gérer le corps pour les requêtes avec un body (POST, PUT, PATCH)
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                const bodyData = JSON.stringify(req.body);
                // Définir les headers avant d'écrire le body
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

                // Transmettre les informations de l'utilisateur au service
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Role', req.user.role || 'user');
                }

                // Écrire le body en dernier
                proxyReq.write(bodyData);
            } else {
                // Pour les requêtes sans body, ajouter uniquement les headers d'utilisateur
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Role', req.user.role || 'user');
                }
            }
        },
        // Gestion des erreurs
        onError: (err, req, res) => {
            console.error('Proxy Error:', {
                method: req.method,
                path: req.path,
                error: err.message,
                target: target
            });
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Service Unavailable',
                    details: err.message
                });
            }
        },
        // Configuration des en-têtes de réponse
        onProxyRes: (proxyRes, req, res) => {
            if (!res.headersSent) {
                proxyRes.headers['x-proxied-by'] = 'gateway';
            }
            console.log('Proxy Response:', {
                method: req.method,
                path: req.path,
                status: proxyRes.statusCode
            });
        }
    });
};

// Configuration des proxies
const authProxy = createServiceProxy(
    process.env.AUTH_SERVICE_URL,
    { '^/auth': '' }
);

const menuProxy = createServiceProxy(
    process.env.MENU_SERVICE_URL,
    { '^/menu': '' }
);

const orderProxy = createServiceProxy(
    process.env.ORDER_SERVICE_URL,
    { '^/orders': '/orders' }
);

// Routes
router.get('/', (req, res) => {
    res.json({ message: 'Gateway Service is running' });
});

// Routes publiques
router.post('/auth/signin', authProxy);
router.post('/auth/signup', authProxy);
router.post('/auth/refresh', authProxy);

// Routes protégées
router.use('/auth/*', authMiddleware, authProxy);
router.use('/menu/*', authMiddleware, menuProxy);
router.use('/orders', authMiddleware, orderProxy);
router.use('/orders/*', authMiddleware, orderProxy);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

export default router;
