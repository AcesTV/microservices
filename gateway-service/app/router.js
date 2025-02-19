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
                const contentType = proxyReq.getHeader('Content-Type');
                const writeBody = (bodyData) => {
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                };

                if (contentType === 'application/json') {
                    writeBody(JSON.stringify(req.body));
                } else if (contentType === 'application/x-www-form-urlencoded') {
                    const body = new URLSearchParams(req.body).toString();
                    writeBody(body);
                }
            }

            // Transmettre les informations de l'utilisateur au service
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'user');
            }
        },
        // Gestion des erreurs
        onError: (err, req, res) => {
            console.error('Proxy Error:', {
                method: req.method,
                path: req.path,
                error: err.message
            });
            res.status(502).json({
                error: 'Service Unavailable',
                details: err.message,
                method: req.method,
                path: req.path
            });
        },
        // Configuration des en-têtes
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['x-proxied-by'] = 'gateway';
            console.log('Proxy Response:', {
                method: req.method,
                path: req.path,
                status: proxyRes.statusCode
            });
        }
    });
};

// Configuration des proxies
const authServiceProxy = createServiceProxy(
    process.env.AUTH_SERVICE_URL,
    { '^/auth': '' }
);

const menuServiceProxy = createServiceProxy(
    process.env.MENU_SERVICE_URL,
    { '^/menu': '' }
);

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes
router.get('/', (req, res) => {
    res.json({ message: 'Gateway Service is running' });
});

// Proxy routes
router.use('/auth', authServiceProxy);
router.use('/menu', menuServiceProxy);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

export default router;
