import express from "express";
import router from "./router.js";

import cors from 'cors';
import morgan from 'morgan';

const app = express();

const port = process.env.PORT || 8002;

app.use(morgan('dev')); // Logging
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    console.log('Request body:', req.body);
    next();
});

app.use('/', router);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(port, () => {
    console.log(`Gateway service listening on port ${port}`);
});