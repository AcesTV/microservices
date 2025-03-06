import amqp from 'amqplib';
import NotificationService from '../services/notificationService.js';

class Consumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'microservices';
        this.isConnected = false;
        this.notificationService = new NotificationService();
    }

    async initialize() {
        await this.notificationService.initialize();
    }

    async connect() {
        try {
            if (!this.isConnected) {
                // Connect to RabbitMQ
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
                
                this.isConnected = true;
                console.log('Notification Consumer connected to RabbitMQ');

                // Handle reconnection
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
            // Initialize the service first
            await this.initialize();
            
            if (!this.isConnected) {
                await this.connect();
            }

            // Create a unique queue for this consumer
            const q = await this.channel.assertQueue('notification-service-orders', { durable: true });

            // Bind the queue to the exchange for order status events
            await this.channel.bindQueue(q.queue, this.exchange, 'orders.status.updated');

            // Start consuming messages
            await this.channel.consume(q.queue, async (msg) => {
                try {
                    const message = JSON.parse(msg.content.toString());
                    console.log('Received order status update:', message);

                    // Process the notification using the service
                    await this.notificationService.createNotification(message.data);

                    // Acknowledge the message
                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    // In case of error, return message to queue
                    this.channel.nack(msg);
                }
            });

            console.log('Started consuming orders.status.updated events');
        } catch (error) {
            console.error('Error starting consumer:', error);
            setTimeout(() => this.startConsuming(), 5000);
        }
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            this.isConnected = false;
            console.log('Consumer connections closed');
        } catch (error) {
            console.error('Error closing connections:', error);
        }
    }
}

export default Consumer; 