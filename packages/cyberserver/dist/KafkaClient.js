"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaSingleton = void 0;
const kafkajs_1 = require("kafkajs");
const os_1 = require("os");
class KafkaSingleton {
    // Constructor that accepts a Kafka configuration
    constructor(config) {
        KafkaSingleton.config = config;
    }
    // Initialize Kafka and producer
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!KafkaSingleton.producer) {
                const kafka = new kafkajs_1.Kafka({
                    clientId: KafkaSingleton.config.clientId || `${(0, os_1.hostname)()}-http-instance`,
                    brokers: KafkaSingleton.config.brokers,
                    connectionTimeout: KafkaSingleton.config.connectionTimeout || 10000,
                });
                KafkaSingleton.producer = kafka.producer();
            }
        });
    }
    // Connect producer if not connected, retry logic if connection fails
    static connectProducer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!KafkaSingleton.connected) {
                try {
                    yield KafkaSingleton.init(); // Initialize Kafka and producer
                    yield KafkaSingleton.producer.connect();
                    KafkaSingleton.connected = true;
                    console.log('Kafka producer connected.');
                }
                catch (error) {
                    console.error('Failed to connect Kafka producer:', error);
                    // Retry after the configured interval
                    setTimeout(() => KafkaSingleton.connectProducer(), KafkaSingleton.config.retryInterval || 5000);
                }
            }
        });
    }
    static ensureConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!KafkaSingleton.connected) {
                yield KafkaSingleton.connectProducer();
            }
        });
    }
    // Dynamic method to send any message to any topic and partition
    static sendMessage(topic, message, partition) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield KafkaSingleton.ensureConnected();
                yield KafkaSingleton.producer.send({
                    topic,
                    messages: [{ value: message, partition }],
                });
                console.log(`Message sent to ${topic}, partition ${partition}: ${message}`);
            }
            catch (error) {
                console.error('Failed to send message:', error);
            }
        });
    }
    // Wrapper methods to call the dynamic sendMessage with a specific topic
    static sendToTopic(topic_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (topic, message, partition = 0) {
            yield KafkaSingleton.sendMessage(topic, message, partition);
        });
    }
    // Optional: predefined methods to use common topics
    static addUser(userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('user', userInfo, 1);
        });
    }
    static updateUser(userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('user', userInfo, 2);
        });
    }
    static addSpace(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('space', spaceInfo, 1);
        });
    }
    static deleteSpace(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('space', spaceInfo, 2);
        });
    }
    static addElementAdmin(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('element', spaceInfo, 1);
        });
    }
    static updateElementAdmin(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('element', spaceInfo, 2);
        });
    }
    static addAvatar(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('element', spaceInfo, 3);
        });
    }
    static addMap(spaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield KafkaSingleton.sendToTopic('element', spaceInfo, 4);
        });
    }
    // Static method to initialize the KafkaSingleton with custom config
    static initialize(config) {
        if (!KafkaSingleton.config) {
            new KafkaSingleton(config); // Initialize with config
        }
        else {
            console.warn('KafkaSingleton has already been initialized.');
        }
    }
}
exports.KafkaSingleton = KafkaSingleton;
KafkaSingleton.connected = false;
