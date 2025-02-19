import express from "express";
import router from "./router.js";
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`Auth service listening on port ${port}`);
});