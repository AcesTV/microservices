import pool from '../config/database.js';

export const orderController = {
    // Créer une commande
    create: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { items } = req.body;
            const userId = req.headers['x-user-id'];

            // Calculer le montant total
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            // Créer la commande
            const orderResult = await client.query(
                'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
                [userId, totalAmount]
            );
            const order = orderResult.rows[0];

            // Ajouter les items
            for (const item of items) {
                await client.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
                    [order.id, item.productId, item.quantity, item.unitPrice]
                );
            }

            await client.query('COMMIT');
            res.status(201).json(order);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Lister toutes les commandes (pour admin)
    list: async (req, res) => {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM orders ORDER BY created_at DESC'
            );

            // Pour chaque commande, récupérer ses items
            const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
                const itemsResult = await client.query(
                    'SELECT * FROM order_items WHERE order_id = $1',
                    [order.id]
                );
                return {
                    ...order,
                    items: itemsResult.rows
                };
            }));

            res.json(ordersWithItems);
        } catch (error) {
            console.error('Error listing orders:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Lister les commandes d'un utilisateur
    listUserOrders: async (req, res) => {
        const client = await pool.connect();
        try {
            const userId = req.headers['x-user-id'];
            const result = await client.query(
                'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );

            // Pour chaque commande, récupérer ses items
            const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
                const itemsResult = await client.query(
                    'SELECT * FROM order_items WHERE order_id = $1',
                    [order.id]
                );
                return {
                    ...order,
                    items: itemsResult.rows
                };
            }));

            res.json(ordersWithItems);
        } catch (error) {
            console.error('Error listing user orders:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Obtenir une commande spécifique
    get: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const userId = req.headers['x-user-id'];
            const userRole = req.headers['x-user-role'];

            // Construire la requête en fonction du rôle
            let orderResult;
            if (userRole === 'admin') {
                // Les admins peuvent voir toutes les commandes
                orderResult = await client.query(
                    'SELECT * FROM orders WHERE id = $1',
                    [id]
                );
            } else {
                // Les utilisateurs ne peuvent voir que leurs commandes
                orderResult = await client.query(
                    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
                    [id, userId]
                );
            }

            if (orderResult.rows.length === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const itemsResult = await client.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [id]
            );

            res.json({
                ...orderResult.rows[0],
                items: itemsResult.rows
            });
        } catch (error) {
            console.error('Error getting order:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Mettre à jour le statut d'une commande
    updateStatus: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { status } = req.body;
            // Pour les admins, pas besoin de vérifier user_id
            const result = await client.query(
                'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [status, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    },

    // Supprimer une commande
    delete: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            // Pour les admins, pas besoin de vérifier user_id
            const result = await client.query(
                'DELETE FROM orders WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error('Error deleting order:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
}; 