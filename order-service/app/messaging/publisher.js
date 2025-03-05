import amqp from 'amqplib';

class Publisher {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'microservices';
        this.isConnected = false;
    }

    async connect() {
        try {
            if (!this.isConnected) {
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
                this.isConnected = true;
                console.log('Connected to RabbitMQ');

                // Gérer la reconnexion en cas de perte de connexion
                this.connection.on('close', () => {
                    console.log('RabbitMQ connection closed. Trying to reconnect...');
                    this.isConnected = false;
                    setTimeout(() => this.connect(), 5000);
                });
            }
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error);
            this.isConnected = false;
            setTimeout(() => this.connect(), 5000);
        }
    }

    async publishEvent(routingKey, data) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const message = {
                data,
                timestamp: new Date(),
                eventType: routingKey
            };

            const success = this.channel.publish(
                this.exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            if (success) {
                console.log(`Event published: ${routingKey}`, message);
            } else {
                console.warn(`Failed to publish event: ${routingKey}`, message);
            }

            return success;
        } catch (error) {
            console.error('Error publishing event:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            console.log('Disconnected from RabbitMQ');
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }
}

// Créer une instance unique
const publisher = new Publisher();

// Connecter au démarrage
publisher.connect().catch(console.error);

// Gérer la fermeture propre
process.on('SIGINT', async () => {
    await publisher.close();
    process.exit(0);
});

export default publisher; 