import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

// Configuration des proxies
const authServiceProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': ''
    },
    onError: (err, req, res) => {
        res.status(500).json({ error: 'Auth Service Unavailable' });
    }
});

const menuServiceProxy = createProxyMiddleware({
    target: process.env.MENU_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/menu': ''
    },
    onError: (err, req, res) => {
        res.status(500).json({ error: 'Menu Service Unavailable' });
    }
});

// Routes
router.get("/", (req, res) => {
       res.json("Welcome to the gateway service");
   });

// Proxy routes
router.use('/auth', authServiceProxy);
router.use('/menu', menuServiceProxy);

router.use((req, res) => {
           res.status(404);
           res.json({
               error: "Page not found"
           });
       });

export default router;
