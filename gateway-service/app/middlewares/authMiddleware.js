import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

// Liste des routes publiques
const publicRoutes = [
    { path: '/auth/signup', method: 'POST' },
    { path: '/auth/signin', method: 'POST' },
    { path: '/auth/refresh', method: 'POST' }
];

// Liste des routes protégées avec leurs rôles requis
const protectedRoutes = [
    // Routes des menus
    { path: '/menu/products', method: 'GET', roles: ['user', 'admin'] },
    { path: '/menu/products', method: 'POST', roles: ['admin'] },
    { path: '/menu/products/:id', method: 'PUT', roles: ['admin'] },
    { path: '/menu/products/:id', method: 'DELETE', roles: ['admin'] },
    
    // Routes d'authentification protégées
    { path: '/auth/me', method: 'GET', roles: ['user', 'admin'] },
    { path: '/auth/verify', method: 'GET', roles: ['user', 'admin'] },
    { path: '/auth/signout', method: 'POST', roles: ['user', 'admin'] }
];

export const authMiddleware = async (req, res, next) => {
    try {
        // Vérifier si c'est une route publique
        const isPublicRoute = publicRoutes.some(route => {
            const pathMatch = req.path === route.path;
            const methodMatch = req.method === route.method;
            return pathMatch && methodMatch;
        });

        if (isPublicRoute) {
            console.log('Public route accessed:', req.path);
            return next();
        }

        // Vérifier le token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Vérifier les permissions pour les routes protégées
        const matchedRoute = protectedRoutes.find(route => {
            const pathRegex = new RegExp('^' + route.path.replace(/:\w+/g, '[^/]+') + '$');
            return pathRegex.test(req.path) && route.method === req.method;
        });

        if (matchedRoute) {
            // Utiliser le rôle du token
            const userRole = decoded.role || 'user';
            const hasPermission = matchedRoute.roles.includes(userRole);

            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Insufficient permissions',
                    required: matchedRoute.roles,
                    current: userRole
                });
            }
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', {
            name: error.name,
            message: error.message,
            path: req.path,
            token: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...'
        });
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}; 