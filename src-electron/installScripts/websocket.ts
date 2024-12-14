import WebSocket from 'ws'; // Import the WebSocket library
import { log } from 'electron-log';
import { sendFeedback } from '../sendFeedback';
import net from 'net'; // Import the net module

let wss: WebSocket.Server | null = null;

const PORT = 8766;
const HOST = '0.0.0.0';

// Function to check if the port is in use
const isPortInUse = (port: number, host: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false); // Other error
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(false)); // Port is not in use
    });

    server.listen(port, host);
  });
};

// Initialize the WebSocket server
export const initWebSocket = async (openWindowCallback: any) => {
  const portInUse = await isPortInUse(PORT, HOST);

  if (portInUse) {
    log(`WebSocket server already running on ${HOST}:${PORT}`);
    return; // Prevent creating a new server if the port is in use
  }

  try {
    wss = new WebSocket.Server({ port: PORT, host: HOST });

    wss.on('connection', (ws) => {
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

    log(`WebSocket server started on ${HOST}:${PORT}`);
  } catch (error) {
    log(`Failed to start WebSocket server: ${error}`);
  }
};

// Run the WebSocket server
initWebSocket((title: string, url: string) => {
  log(`Open window called with title: ${title} and URL: ${url}`);
});
