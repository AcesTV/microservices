import express from 'express';
import { orderController } from '../controllers/orderController.js';

const router = express.Router();

// Vérification du rôle admin
const adminCheck = (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Admin role required.',
            current: userRole
        });
    }
    next();
};

// Routes génériques
router.get('/', orderController.listUserOrders);  // Liste les commandes de l'utilisateur
router.post('/', orderController.create);         // Créer une commande

// Routes admin
router.get('/all', adminCheck, orderController.list);  // Liste toutes les commandes (admin seulement)
router.patch('/:id/status', adminCheck, orderController.updateStatus);  // Modifier le statut
router.delete('/:id', adminCheck, orderController.delete);  // Supprimer une commande

// Route avec vérification de propriété
router.get('/:id', orderController.get);  // Obtenir une commande (déjà vérifié dans le contrôleur)

export default router; 