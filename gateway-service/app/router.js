import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

// Configuration commune pour les proxies
const createServiceProxy = (target, pathRewrite) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        logLevel: 'debug',
        onError: (err, req, res) => {
            console.error('Proxy Error:', err);
            res.status(500).json({ error: 'Service Unavailable', details: err.message });
        },
        onProxyReq: (proxyReq, req, res) => {
            // Gérer le corps de la requête pour les requêtes POST
            if (req.body && req.method === 'POST') {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
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

// Routes
router.get('/', (req, res) => {
    res.json({ message: 'Gateway Service is running' });
});

// Proxy routes
router.use('/auth', authServiceProxy);
router.use('/menu', menuServiceProxy);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

export default router;
