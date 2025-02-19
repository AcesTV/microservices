import express from 'express';
import { menuController } from '../controllers/menuController.js';

const router = express.Router();

// Routes
router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);
router.post('/', menuController.createMenu);
router.put('/:id', menuController.updateMenu);
router.delete('/:id', menuController.deleteMenu);

export default router; 