import { ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import { spawnWorker } from './workerUtils';
// import { mainWindow, appUrl, openWindow, initWebSocket, containersDefault } from './main';
import { delay } from './utils';
import { logger as log } from './utils';

export const initializeIpcHandlers = () => {
  // ipcMain.on('auth-redirect', (event, url) => {
  //   log('Received auth redirect:', url);
  //   const mainWindow = BrowserWindow.getAllWindows()[0];
  //   if (mainWindow) {
  //     // Navigate to auth route
  //     mainWindow.webContents.executeJavaScript(`
  //       window.location.href = '/#/auth${url.includes('access_token') ? window.location.hash : ''}'
  //     `);
  //   }
  // });
  // ipcMain.handle('check-for-updates', async (event, productId) => {
  //   try {
  //     const result = await spawnWorker('checkUpdatesWorker', { productId });
  //     return result;
  //   } catch (error) {
  //     console.error('Error in check-for-updates worker:', error);
  //     throw error;
  //   }
  // });
  // ipcMain.handle('install-dependencies', async (event, productId, callback) => {
  //   try {
  //     const result = await spawnWorker(
  //       'installWorker',
  //       { productId },
  //       callback,
  //     );
  //     return result;
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message || 'Failed to install dependencies',
  //     };
  //   }
  // });
  // ipcMain.handle(
  //   'check-docker-containers',
  //   async (event, containerNames = containersDefault) => {
  //     return new Promise((resolve, reject) => {
  //       const dockerPs = spawn(
  //         'docker',
  //         ['ps', '-a', '--format', '{{.Names}}'],
  //         {
  //           env: process.env,
  //         },
  //       );
  //       let stdout = '';
  //       dockerPs.stdout.on('data', (data) => {
  //         stdout += data.toString();
  //       });
  //       dockerPs.stderr.on('data', (data) => {
  //         console.error(`Error executing command: ${data}`);
  //       });
  //       dockerPs.on('close', async (code) => {
  //         if (code !== 0) {
  //           return reject(`docker ps exited with code ${code}`);
  //         }
  //         const allContainers = stdout.split('\n').filter(Boolean);
  //         const foundContainers = containerNames.filter((name) =>
  //           allContainers.includes(name),
  //         );
  //         if (foundContainers.length === containerNames.length) {
  //           for (const container of foundContainers) {
  //             spawn('docker', ['start', container], { env: process.env });
  //             await delay(2000); // Wait before starting the next container
  //           }
  //           mainWindow?.loadURL(appUrl);
  //           initWebSocket();
  //           resolve({ result: true, details: 'All containers started' });
  //         } else {
  //           resolve({ result: false, details: 'Some containers not found' });
  //         }
  //       });
  //     });
  //   },
  // );
};
