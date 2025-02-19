import express from "express";

const router = express.Router();

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
