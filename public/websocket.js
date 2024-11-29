"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws")); // Import the WebSocket library
// import { logger } from './utils';
// @ts-ignore
let wss = null;
const initWebSocket = () => {
    // @ts-ignore
    wss?.on('connection', (ws) => {
        // logger('Client connected');
        ws.on('message', (message) => {
            const messageString = message instanceof Buffer ? message.toString() : message;
            try {
                // Parse the string as JSON
                const data = JSON.parse(messageString);
                // logger(`Received: ${data}`);
                // Perform actions based on the received message
                if (data.message === 'open-window') {
                    // openWindow(data.windowTitle, data.url);
                    // logger('Triggering action in Electron app!');
                }
            }
            catch (error) {
                console.error('Error parsing message:', error);
            }
        });
        ws.on('close', () => {
            // logger('Client disconnected');
        });
    });
};
if (!wss) {
    try {
        wss = new ws_1.default.Server({ port: 8766, host: '0.0.0.0' });
        initWebSocket();
        // console.log('🚀 ~ createWindow ~ wss:', wss);
    }
    catch (error) {
        // logger(`ERROR ${error}`);
    }
}
