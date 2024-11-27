import { Kafka, Producer } from 'kafkajs';
import { hostname } from 'os';

interface KafkaConfig {
    clientId?: string;
    brokers: string[];
    retryInterval?: number; // Interval for retry in case of failure (default: 5000ms)
    connectionTimeout?: number; // Connection timeout (default: 10000ms)
}

class KafkaSingleton {
    private static producer: Producer;
    private static connected: boolean = false;
    private static config: KafkaConfig;

    // Constructor that accepts a Kafka configuration
    private constructor(config: KafkaConfig) {
        KafkaSingleton.config = config;
    }

    // Initialize Kafka and producer
    private static async init(): Promise<void> {
        if (!KafkaSingleton.producer) {
            const kafka = new Kafka({
                clientId: KafkaSingleton.config.clientId || `${hostname()}-http-instance`,
                brokers: KafkaSingleton.config.brokers,
                connectionTimeout: KafkaSingleton.config.connectionTimeout || 10000,
            });

            KafkaSingleton.producer = kafka.producer();
        }
    }

    // Connect producer if not connected, retry logic if connection fails
    private static async connectProducer(): Promise<void> {
        if (!KafkaSingleton.connected) {
            try {
                await KafkaSingleton.init();  // Initialize Kafka and producer
                await KafkaSingleton.producer.connect();
                KafkaSingleton.connected = true;
                console.log('Kafka producer connected.');
            } catch (error) {
                console.error('Failed to connect Kafka producer:', error);
                // Retry after the configured interval
                setTimeout(() => KafkaSingleton.connectProducer(), KafkaSingleton.config.retryInterval || 5000);
            }
        }
    }

    private static async ensureConnected(): Promise<void> {
        if (!KafkaSingleton.connected) {
            await KafkaSingleton.connectProducer();
        }
    }

    // Dynamic method to send any message to any topic and partition
    private static async sendMessage(topic: string, message: string, partition: number): Promise<void> {
        try {
            await KafkaSingleton.ensureConnected();

            await KafkaSingleton.producer.send({
                topic,
                messages: [{ value: message, partition }],
            });

            console.log(`Message sent to ${topic}, partition ${partition}: ${message}`);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    // Wrapper methods to call the dynamic sendMessage with a specific topic
    public static async sendToTopic(topic: string, message: string, partition: number = 0): Promise<void> {
        await KafkaSingleton.sendMessage(topic, message, partition);
    }

    // Optional: predefined methods to use common topics
    public static async addUser(userInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('user', userInfo, 1);
    }

    public static async updateUser(userInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('user', userInfo, 2);
    }

    public static async addSpace(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('space', spaceInfo, 1);
    }

    public static async deleteSpace(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('space', spaceInfo, 2);
    }

    public static async addElementAdmin(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('element', spaceInfo, 1);
    }

    public static async updateElementAdmin(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('element', spaceInfo, 2);
    }

    public static async addAvatar(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('element', spaceInfo, 3);
    }

    public static async addMap(spaceInfo: string): Promise<void> {
        await KafkaSingleton.sendToTopic('element', spaceInfo, 4);
    }

    // Static method to initialize the KafkaSingleton with custom config
    public static initialize(config: KafkaConfig): void {
        if (!KafkaSingleton.config) {
            new KafkaSingleton(config); // Initialize with config
        } else {
            console.warn('KafkaSingleton has already been initialized.');
        }
    }
}

export { KafkaSingleton, KafkaConfig };
