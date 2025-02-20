import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const authController = {
    // Sign Up
    signup: async (req, res) => {
        const client = await pool.connect();
        try {
            const { username, password, email } = req.body;

            if (!username || !password || !email) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Vérifier si l'utilisateur existe
            const userCheck = await client.query(
                'SELECT * FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );

            if (userCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Username or email already exists' });
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Créer l'utilisateur
            const result = await client.query(
                'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
                [username, email, hashedPassword]
            );

            res.status(201).json({
                message: 'User created successfully',
                userId: result.rows[0].id
            });
        } catch (error) {
            console.error('Error in signup:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Sign In
    signin: async (req, res) => {
        const client = await pool.connect();
        try {
            const { username, password } = req.body;

            const result = await client.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );

            const user = result.rows[0];
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            await client.query(
                'INSERT INTO tokens (user_id, token) VALUES ($1, $2)',
                [user.id, refreshToken]
            );

            res.json({ accessToken, refreshToken });
        } catch (error) {
            console.error('Error in signin:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Sign Out
    signout: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const client = await pool.connect();

            // Supprimer le refresh token
            await client.query(
                'DELETE FROM tokens WHERE token = $1',
                [refreshToken]
            );

            client.release();
            res.json({ message: 'Successfully logged out' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Verify Token
    verify: async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).json({ message: 'Invalid token' });
                }
                res.json(decoded);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Refresh Token
    refresh: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const client = await pool.connect();

            // Vérifier si le refresh token existe en base
            const result = await client.query(
                'SELECT * FROM tokens WHERE token = $1',
                [refreshToken]
            );

            if (result.rows.length === 0) {
                client.release();
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Vérifier et décoder le refresh token
            jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
                if (err) {
                    await client.query(
                        'DELETE FROM tokens WHERE token = $1',
                        [refreshToken]
                    );
                    client.release();
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }

                // Créer un nouveau access token
                const userResult = await client.query(
                    'SELECT * FROM users WHERE id = $1',
                    [decoded.userId]
                );

                const user = userResult.rows[0];
                const accessToken = jwt.sign(
                    { userId: user.id, username: user.username, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '15m' }
                );

                client.release();
                res.json({ accessToken });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get User Info
    me: async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            const client = await pool.connect();
            
            // Convertir l'ID string en ObjectId pour la recherche
            const userResult = await client.query(
                'SELECT * FROM users WHERE id = $1',
                [decoded.userId]
            );

            const user = userResult.rows[0];

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                _id: user.id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            });
        } catch (error) {
            console.error('Error in me:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            if (error.message.includes('hex string')) {
                return res.status(400).json({ message: 'Invalid user ID format' });
            }
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
}; 