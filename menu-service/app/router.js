import express from "express";
import productsRouter from './routes/products.js';
import menusRouter from './routes/menus.js';

const router = express.Router();

router.get("/", (req, res) => {
       res.json("Welcome to the menu service");
   });

router.use('/products', productsRouter);
router.use('/menus', menusRouter);

router.use((req, res) => {
           res.status(404);
           res.json({
               error: "Page not found"
           });
       });

export default router;
