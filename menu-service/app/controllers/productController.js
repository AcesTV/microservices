import { MongoClient, ObjectId } from 'mongodb';

const url = process.env.MONGODB_URI;

export const productController = {
    // Get all products
    getAllProducts: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const products = await db.collection('products').find().toArray();
            client.close();
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get product by ID
    getProductById: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const product = await db.collection('products').findOne({ 
                _id: ObjectId.createFromHexString(req.params.id)
            });
            client.close();
            if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
            res.json(product);
        } catch (error) {
            if (error.message.includes('hex string')) {
                return res.status(400).json({ message: 'ID invalide' });
            }
            res.status(500).json({ error: error.message });
        }
    },

    // Create new product
    createProduct: async (req, res) => {
        try {
            const { name, description } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const result = await db.collection('products').insertOne({
                name,
                description,
                created_at: new Date()
            });
            client.close();
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update product
    updateProduct: async (req, res) => {
        try {
            const { name, description } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const result = await db.collection('products').updateOne(
                { _id: ObjectId.createFromHexString(req.params.id) },
                { $set: { name, description, updated_at: new Date() } }
            );
            client.close();
            if (result.matchedCount === 0) return res.status(404).json({ message: 'Produit non trouvé' });
            res.json({ message: 'Produit mis à jour' });
        } catch (error) {
            if (error.message.includes('hex string')) {
                return res.status(400).json({ message: 'ID invalide' });
            }
            res.status(500).json({ error: error.message });
        }
    },

    // Delete product
    deleteProduct: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const result = await db.collection('products').deleteOne({ 
                _id: ObjectId.createFromHexString(req.params.id)
            });
            client.close();
            if (result.deletedCount === 0) return res.status(404).json({ message: 'Produit non trouvé' });
            res.json({ message: 'Produit supprimé' });
        } catch (error) {
            if (error.message.includes('hex string')) {
                return res.status(400).json({ message: 'ID invalide' });
            }
            res.status(500).json({ error: error.message });
        }
    }
}; 