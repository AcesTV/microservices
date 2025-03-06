import amqp from 'amqplib';
import { MongoClient, ObjectId } from 'mongodb';

class Consumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'microservices';
        this.isConnected = false;
        this.mongoClient = null;
    }

    async connect() {
        try {
            if (!this.isConnected) {
                // Connexion à RabbitMQ
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

                // Connexion à MongoDB
                this.mongoClient = await MongoClient.connect(process.env.MONGODB_URI);
                
                this.isConnected = true;
                console.log('Consumer connected to RabbitMQ and MongoDB');

                // Gérer la reconnexion
                this.connection.on('close', () => {
                    console.log('RabbitMQ connection closed. Trying to reconnect...');
                    this.isConnected = false;
                    setTimeout(() => this.connect(), 5000);
                });
            }
        } catch (error) {
            console.error('Error connecting:', error);
            this.isConnected = false;
            setTimeout(() => this.connect(), 5000);
        }
    }

    async startConsuming() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            // Créer une queue unique pour ce consumer
            const q = await this.channel.assertQueue('menu-service-orders', { durable: true });

            // Lier la queue à l'exchange pour les événements de commande
            await this.channel.bindQueue(q.queue, this.exchange, 'orders.created');

            // Commencer à consommer les messages
            await this.channel.consume(q.queue, async (msg) => {
                try {
                    const message = JSON.parse(msg.content.toString());
                    console.log('Received order:', message);

                    // Traiter la commande
                    await this.processOrder(message.data);

                    // Acquitter le message
                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    // En cas d'erreur, remettre le message dans la queue
                    this.channel.nack(msg);
                }
            });

            console.log('Started consuming orders.created events');
        } catch (error) {
            console.error('Error starting consumer:', error);
            setTimeout(() => this.startConsuming(), 5000);
        }
    }

    async processOrder(orderData) {
        const db = this.mongoClient.db('menu_db');
        const productsCollection = db.collection('products');

        // Pour chaque item dans la commande
        for (const item of orderData.items) {
            try {
                // Convertir l'ID du produit en ObjectId
                const productId = ObjectId.createFromHexString(item.productId);
                
                // D'abord, récupérer le produit existant
                const existingProduct = await productsCollection.findOne(
                    { _id: productId }
                );

                if (existingProduct) {
                    // Mettre à jour uniquement les statistiques
                    await productsCollection.updateOne(
                        { _id: productId },
                        {
                            $inc: {
                                totalOrders: 1,
                                totalQuantitySold: item.quantity,
                                totalRevenue: item.quantity * item.unitPrice
                            },
                            $set: {
                                lastOrderDate: new Date()
                            }
                        }
                    );
                } else {
                    // Créer un nouveau document de statistiques
                    await productsCollection.insertOne({
                        _id: productId,
                        totalOrders: 1,
                        totalQuantitySold: item.quantity,
                        totalRevenue: item.quantity * item.unitPrice,
                        lastOrderDate: new Date()
                    });
                }
            } catch (error) {
                console.error(`Error processing order item ${item.productId}:`, error);
                throw error;
            }
        }
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            if (this.mongoClient) await this.mongoClient.close();
            this.isConnected = false;
            console.log('Consumer connections closed');
        } catch (error) {
            console.error('Error closing connections:', error);
        }
    }
}

// Créer et démarrer le consumer
const consumer = new Consumer();
consumer.startConsuming().catch(console.error);

// Gérer la fermeture propre
process.on('SIGINT', async () => {
    await consumer.close();
    process.exit(0);
});

export default consumer; 