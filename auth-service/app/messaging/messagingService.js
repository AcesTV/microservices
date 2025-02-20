import amqp from 'amqplib';

class MessagingService {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            this.connection = await amqp.connect('amqp://admin:password@rabbitmq:5672');
            this.channel = await this.connection.createChannel();
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error);
            throw error;
        }
    }

    async publishEvent(exchange, routingKey, message) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            this.channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(message))
            );

            console.log(`Event published to ${exchange}:${routingKey}`, message);
        } catch (error) {
            console.error('Error publishing event:', error);
            throw error;
        }
    }

    async subscribeToEvent(exchange, routingKey, handler) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            const q = await this.channel.assertQueue('', { exclusive: true });

            await this.channel.bindQueue(q.queue, exchange, routingKey);
            await this.channel.consume(q.queue, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await handler(content);
                        this.channel.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        // Rejeter le message en cas d'erreur
                        this.channel.nack(msg);
                    }
                }
            });

            console.log(`Subscribed to ${exchange}:${routingKey}`);
        } catch (error) {
            console.error('Error subscribing to event:', error);
            throw error;
        }
    }

    async close() {
        try {
            await this.channel?.close();
            await this.connection?.close();
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }
}

export default new MessagingService(); 