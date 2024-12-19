import WebSocket from 'ws'; // Import the WebSocket library
import { log } from 'electron-log';
import { sendFeedback } from '../sendFeedback';

// import { logger } from './utils';
// @ts-ignore
let wss: Server<typeof WebSocket, typeof IncomingMessage> = null;
let openWindow: Function | null = null;

export const setWindowCallback = (openWindowCallback: any) => {
  if (!openWindow) {
    openWindow = openWindowCallback;
  }
};

export const initWebSocket = (openWindowCallback: any = openWindow) => {
  if (!wss) {
    try {
      wss = new WebSocket.Server({ port: 8766, host: '0.0.0.0' });
      // initWebSocket();
      // console.log('🚀 ~ createWindow ~ wss:', wss);
    } catch (error) {
      log(`ERROR ${error}`);
    }
  }

  // @ts-ignore
  wss?.on('connection', (ws) => {
    log('Client connected');

    ws.on('message', (message: any) => {
      const messageString =
        message instanceof Buffer ? message.toString() : message;

      try {
        // Parse the string as JSON
        const data = JSON.parse(messageString);
        log(`Received: ${data}, ${data.message}`);

        // Perform actions based on the received message
        if (data.message === 'open-window') {
          openWindowCallback(data.windowTitle, data.url);
          log('Triggering action in Electron app!');
        } else if (data.message === 'send-feedback') {
          const { to, subject, message } = data.data;
          console.log('🚀 ~ ws.on ~ message:', message);
          console.log('🚀 ~ ws.on ~ subject:', subject);
          console.log('🚀 ~ ws.on ~ to:', to);
          const response = sendFeedback(to, subject, message);
          log(`Triggering send feedback ${response}`);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      log('Client disconnected');
    });
  });
};
