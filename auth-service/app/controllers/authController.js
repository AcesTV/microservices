import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const url = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export const authController = {
    // Sign Up
    signup: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('auth_db');

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await db.collection('users').findOne({ 
                $or: [{ username }, { email }] 
            });

            if (existingUser) {
                client.close();
                return res.status(400).json({ message: 'Username or email already exists' });
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Créer l'utilisateur
            const result = await db.collection('users').insertOne({
                username,
                email,
                password: hashedPassword,
                created_at: new Date()
            });

            client.close();
            res.status(201).json({ 
                message: 'User created successfully',
                userId: result.insertedId,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Sign In
    signin: async (req, res) => {
        try {
            const { username, password } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('auth_db');

            // Trouver l'utilisateur
            const user = await db.collection('users').findOne({ username });

            if (!user) {
                client.close();
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Vérifier le mot de passe
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                client.close();
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Créer les tokens
            const accessToken = jwt.sign(
                { userId: user._id, username: user.username },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            // Sauvegarder le refresh token
            await db.collection('tokens').insertOne({
                userId: user._id,
                token: refreshToken,
                created_at: new Date()
            });

            client.close();
            res.json({ accessToken, refreshToken });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Sign Out
    signout: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('auth_db');

            // Supprimer le refresh token
            await db.collection('tokens').deleteOne({ token: refreshToken });

            client.close();
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
            const client = await MongoClient.connect(url);
            const db = client.db('auth_db');

            // Vérifier si le refresh token existe en base
            const tokenDoc = await db.collection('tokens').findOne({ token: refreshToken });
            if (!tokenDoc) {
                client.close();
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Vérifier et décoder le refresh token
            jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
                if (err) {
                    await db.collection('tokens').deleteOne({ token: refreshToken });
                    client.close();
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }

                // Créer un nouveau access token
                const user = await db.collection('users').findOne({ _id: tokenDoc.userId });
                const accessToken = jwt.sign(
                    { userId: user._id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '15m' }
                );

                client.close();
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
            jwt.verify(token, JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(401).json({ message: 'Invalid token' });
                }

                const client = await MongoClient.connect(url);
                const db = client.db('auth_db');
                const user = await db.collection('users').findOne(
                    { _id: decoded.userId },
                    { projection: { password: 0 } }
                );

                client.close();
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json(user);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}; 