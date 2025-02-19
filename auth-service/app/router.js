import express from "express";
import authRouter from './routes/auth.js';

const router = express.Router();

router.use('/auth', authRouter);

router.get("/", (req, res) => {
       res.json("Welcome to the auth service");
   });

router.use((req, res) => {
           res.status(404);
           res.json({
               error: "Page not found"
           });
       });

export default router;
