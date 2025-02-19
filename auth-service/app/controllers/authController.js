import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const url = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export const authController = {
    // Sign Up
    signup: async (req, res) => {
        let client;
        try {
            client = await MongoClient.connect(url);

            const { username, password, email } = req.body;

            if (!username || !password || !email) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const db = client.db('auth_db');

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await db.collection('users').findOne({ 
                $or: [{ username }, { email }] 
            });

            if (existingUser) {
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
            console.log('User created with ID:', result.insertedId);

            res.status(201).json({ 
                message: 'User created successfully',
                userId: result.insertedId
            });
        } catch (error) {
            console.error('Error in signup:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        } finally {
            if (client) {
                console.log('Closing MongoDB connection');
                await client.close();
            }
        }
    },

    // Sign In
    signin: async (req, res) => {
        let client;
        try {
            const { username, password } = req.body;
            console.log('Signin attempt for username:', username);

            if (!username || !password) {
                return res.status(400).json({ message: 'Missing credentials' });
            }

            client = await MongoClient.connect(url);
            const db = client.db('auth_db');

            // Trouver l'utilisateur
            const user = await db.collection('users').findOne({ username });

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Vérifier le mot de passe
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Créer les tokens avec l'ID en string
            const accessToken = jwt.sign(
                { 
                    userId: user._id.toString(),
                    username: user.username 
                },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user._id.toString() },
                JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            // Sauvegarder le refresh token
            await db.collection('tokens').insertOne({
                userId: user._id,
                token: refreshToken,
                created_at: new Date()
            });
            console.log('Tokens created and saved');

            res.json({ accessToken, refreshToken });
        } catch (error) {
            console.error('Error in signin:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        } finally {
            if (client) {
                await client.close();
            }
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
                    { userId: user._id.toString(), username: user.username },
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
        let client;
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            client = await MongoClient.connect(url);
            const db = client.db('auth_db');
            
            // Convertir l'ID string en ObjectId pour la recherche
            const user = await db.collection('users').findOne(
                { _id: ObjectId.createFromHexString(decoded.userId) },
                { projection: { password: 0 } }  // Exclure le mot de passe
            );

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                _id: user._id.toString(),
                username: user.username,
                email: user.email,
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
        } finally {
            if (client) await client.close();
        }
    }
}; 