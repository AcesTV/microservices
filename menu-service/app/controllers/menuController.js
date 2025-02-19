import { MongoClient } from 'mongodb';

const url = process.env.MONGODB_URI;

export const menuController = {
    // Get all menus
    getAllMenus: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const menus = await db.collection('menus').find().toArray();
            client.close();
            res.json(menus);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get menu by ID
    getMenuById: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const menu = await db.collection('menus').findOne({ _id: req.params.id });
            client.close();
            if (!menu) return res.status(404).json({ message: 'Menu non trouvé' });
            res.json(menu);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Create new menu
    createMenu: async (req, res) => {
        try {
            const { name, description, price, products } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            
            const productsList = await db.collection('products')
                .find({ name: { $in: products } })
                .toArray();
            
            if (productsList.length !== products.length) {
                client.close();
                return res.status(400).json({ message: 'Certains produits n\'existent pas' });
            }

            const result = await db.collection('menus').insertOne({
                name,
                description,
                price,
                products,
                created_at: new Date(),
                active: true
            });
            
            client.close();
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update menu
    updateMenu: async (req, res) => {
        try {
            const { name, description, price, products, active } = req.body;
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            
            if (products) {
                const productsList = await db.collection('products')
                    .find({ name: { $in: products } })
                    .toArray();
                
                if (productsList.length !== products.length) {
                    client.close();
                    return res.status(400).json({ message: 'Certains produits n\'existent pas' });
                }
            }

            const result = await db.collection('menus').updateOne(
                { _id: req.params.id },
                { 
                    $set: { 
                        ...(name && { name }),
                        ...(description && { description }),
                        ...(price && { price }),
                        ...(products && { products }),
                        ...(active !== undefined && { active }),
                        updated_at: new Date() 
                    } 
                }
            );
            
            client.close();
            if (result.matchedCount === 0) return res.status(404).json({ message: 'Menu non trouvé' });
            res.json({ message: 'Menu mis à jour' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete menu
    deleteMenu: async (req, res) => {
        try {
            const client = await MongoClient.connect(url);
            const db = client.db('menu_db');
            const result = await db.collection('menus').deleteOne({ _id: req.params.id });
            client.close();
            if (result.deletedCount === 0) return res.status(404).json({ message: 'Menu non trouvé' });
            res.json({ message: 'Menu supprimé' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}; 