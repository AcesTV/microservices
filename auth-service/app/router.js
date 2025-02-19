import express from "express";
import authRouter from './routes/auth.js';

const router = express.Router();

router.use('/', authRouter);

router.use((req, res) => {
           res.status(404);
           res.json({
               error: "Page not found"
           });
       });

export default router;
