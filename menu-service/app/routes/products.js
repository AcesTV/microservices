import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();
const url = process.env.MONGODB_URI;

// GET tous les produits
router.get('/', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db('menu_db');
    const products = await db.collection('products').find().toArray();
    client.close();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db('menu_db');
    const product = await db.collection('products').findOne({ _id: req.params.id });
    client.close();
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nouveau produit
router.post('/', async (req, res) => {
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
});

// PUT modifier un produit
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const client = await MongoClient.connect(url);
    const db = client.db('menu_db');
    const result = await db.collection('products').updateOne(
      { _id: req.params.id },
      { $set: { name, description, updated_at: new Date() } }
    );
    client.close();
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json({ message: 'Produit mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un produit
router.delete('/:id', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db('menu_db');
    const result = await db.collection('products').deleteOne({ _id: req.params.id });
    client.close();
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 