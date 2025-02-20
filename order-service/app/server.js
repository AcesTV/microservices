import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './router.js';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/', router);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 8003;

app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}`);
}); 