import express from 'express';
import { orderController } from '../controllers/orderController.js';

const router = express.Router();

// Routes spécifiques d'abord
router.get('/all', orderController.list);         // Liste toutes les commandes (admin)

// Routes avec paramètres ensuite
router.get('/:id', orderController.get);          // Obtenir une commande
router.patch('/:id/status', orderController.updateStatus);  // Modifier le statut
router.delete('/:id', orderController.delete);    // Supprimer une commande

// Routes génériques en dernier
router.get('/', orderController.listUserOrders);  // Liste les commandes de l'utilisateur
router.post('/', orderController.create);         // Créer une commande

export default router; 