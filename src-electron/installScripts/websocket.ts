import WebSocket from 'ws'; // Import the WebSocket library
import { log } from 'electron-log';

// import { logger } from './utils';
// @ts-ignore
let wss: Server<typeof WebSocket, typeof IncomingMessage> = null;

export const initWebSocket = (openWindowCallback: any) => {
  // @ts-ignore
  wss?.on('connection', (ws) => {
    log('Client connected');

    ws.on('message', (message: any) => {
      const messageString =
        message instanceof Buffer ? message.toString() : message;

      try {
        // Parse the string as JSON
        const data = JSON.parse(messageString);
        log(`Received: ${data}`);

        // Perform actions based on the received message
        if (data.message === 'open-window') {
          openWindowCallback(data.windowTitle, data.url);
          log('Triggering action in Electron app!');
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

if (!wss) {
  try {
    wss = new WebSocket.Server({ port: 8766, host: '0.0.0.0' });
    // initWebSocket();
    // console.log('🚀 ~ createWindow ~ wss:', wss);
  } catch (error) {
    log(`ERROR ${error}`);
  }
}
