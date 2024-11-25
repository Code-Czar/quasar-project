import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  dialog,
  session,
  screen,
  ipcRenderer,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import os from 'os';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import WebSocket from 'ws'; // Import the WebSocket library

import { exec, spawn } from 'child_process';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fixPath from 'fix-path';
// const fixPath = await import('fix-path').then((module) => module.default);

fixPath();

// import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
const isProduction = process.env.NODE_ENV === 'production';

const appUrl = 'http://localhost:9000';

const resourcesPath = app.getPath('userData');
const logFile = fs.createWriteStream(`${resourcesPath}/app.log`, {
  flags: 'a',
});

let wss = null;

const containersDefault = ['crm-1', 'frontend-1', 'redis-serv-1', 'backend-1'];

app.enableSandbox();

let mainWindow: BrowserWindow | undefined;

let screenWidth;
let screenHeight;

// console.log = function (message) {
//   logFile.write(`${new Date().toISOString()} - ${message}\n`);
// };
const logger = function (message) {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
  // if (!isProduction) {
  console.log(message);
  // }
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

autoUpdater.autoDownload = true;
autoUpdater.logger = log;
//@ts-expect-error transport
autoUpdater.logger.transports.file.level = 'info';
logger('App starting...');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  screenWidth = width;
  screenHeight = height;
  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    fullscreen: false, // Start in fullscreen mode
    frame: true, // Remove the window frame for a borderless look
    resizable: false, // Optional: Prevent resizing if you want a fixed size
    webPreferences: {
      contextIsolation: true,
      sandbox: false, // add this
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  const mainURL = app.isPackaged
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';
  mainWindow.maximize();
  mainWindow.loadURL(mainURL);

  if (app.isPackaged) {
    // Define the Supabase redirect URI
    const redirectUri = 'http://localhost/auth/callback';
    const filter = { urls: [`${redirectUri}*`] };

    session.defaultSession.webRequest.onBeforeRequest(
      filter,
      (details, callback) => {
        const url = details.url;
        logger('Intercepted URL:', url); // Log the full URL to inspect

        // Parse the fragment (hash) part to extract tokens
        const urlFragment = new URL(url).hash.substring(1); // Remove the `#` symbol
        const fragmentParams = new URLSearchParams(urlFragment);

        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');

        // Log tokens to confirm they are parsed correctly
        logger('Access Token:', accessToken);
        logger('Refresh Token:', refreshToken);

        if (accessToken) {
          // Redirect to index.html#/auth with tokens as query parameters
          mainWindow!.loadURL(
            `${mainURL}#/auth?access_token=${accessToken}&refresh_token=${refreshToken}`,
          );
        }

        // Cancel the original request to prevent navigation
        callback({ cancel: true });
      },
    );
  }
  if (!wss) {
    try {
      wss = new WebSocket.Server({ port: 8766, host: '0.0.0.0' });
      console.log('🚀 ~ createWindow ~ wss:', wss);
    } catch (error) {
      logger('ERROR ', error);
    }
  }
  console.log('🚀 ~ resourcesPath:', resourcesPath);
}

const openWindow = (windowTitle: string, url: string | null = null) => {
  logger('Action triggered from Quasar frontend!');
  const newWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    webPreferences: {
      contextIsolation: true,
      sandbox: false, // add this
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });
  newWindow.setTitle(windowTitle);
  newWindow.loadURL(url ?? 'http://tiktok.com');
};

app.whenReady().then(async () => {
  logger('App is ready, initializing protocols and auto-update check.');
  // await checkForAppUpdate();
  autoUpdater.checkForUpdatesAndNotify();

  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace('app://', '');
    const filePath = path.join(__dirname, urlPath);
    callback({ path: filePath });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});

const initWebSocket = () => {
  // @ts-ignore
  wss?.on('connection', (ws) => {
    logger('Client connected');

    ws.on('message', (message) => {
      const messageString =
        message instanceof Buffer ? message.toString() : message;

      try {
        // Parse the string as JSON
        // @ts-expect-error ignore
        const data = JSON.parse(messageString);
        logger('Received:', data);

        // Perform actions based on the received message
        if (data.message === 'open-window') {
          openWindow(data.windowTitle, data.url);
          logger('Triggering action in Electron app!');
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      logger('Client disconnected');
    });
  });
};

// Helper function to handle worker spawning
function spawnWorker(
  scriptName: string,
  args: any = {},
  callback?: Function = null,
): Promise<any> {
  console.log('🚀 ~ spawnWorker ~ scriptName:', scriptName);
  return new Promise((resolve, reject) => {
    const basePath = isProduction
      ? app.getAppPath()
      : path.resolve(__dirname, '../../src-electron');
    const scriptPath = path.join(
      basePath,
      'installScripts',
      `${scriptName}.${isProduction ? 'js' : 'ts'}`,
    );

    const workerOptions = {
      workerData: { ...args, resourcesPath: app.getPath('userData') },
      execArgv: isProduction ? [] : ['-r', 'ts-node/register/transpile-only'],
    };

    const worker = new Worker(scriptPath, workerOptions);

    worker.on('message', (result) => {
      console.log('RESULT: ', result);
      // console.log();
      if (result.success || result.shouldUpdate !== null) {
        resolve(result);
      } else if (result.success === false) {
        reject(new Error(`Failed to parse worker result: ${result}`));
      } else {
        callback?.(result);
      }
    });

    worker.on('error', (error) => {
      console.error(`Worker error: ${error}`);
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Show dialog when an update is available
autoUpdater.on('update-available', () => {
  const response = dialog.showMessageBoxSync({
    type: 'info',
    buttons: ['Download', 'Later'],
    title: 'Update Available',
    message:
      'A new version of the application is available. Would you like to download it now?',
  });

  // If the user selects "Download", initiate the update download
  if (response === 0) {
    // "Download" button index is 0
    autoUpdater.downloadUpdate();
  }
});

// Inform user when there’s a download progress
autoUpdater.on('download-progress', (progress) => {
  const { percent } = progress;
  log.info(`Download progress: ${percent}%`);
  mainWindow?.webContents.send('update-progress', percent); // Optionally send to renderer for visual progress
});

// Show dialog when update is downloaded and ready to install
autoUpdater.on('update-downloaded', () => {
  const response = dialog.showMessageBoxSync({
    type: 'info',
    buttons: ['Restart Now', 'Later'],
    title: 'Update Ready',
    message:
      'The latest version has been downloaded. Do you want to restart the application to apply the update?',
  });

  // Restart the app if the user chose "Restart Now"
  if (response === 0) {
    // "Restart Now" button index is 0
    autoUpdater.quitAndInstall();
  }
});

// IPC handler for checking updates
ipcMain.handle(
  'check-for-updates',
  async (
    event,
    productId: string,
  ): Promise<{
    shouldUpdate: boolean;
    latestVersion?: string;
    error?: string;
  }> => {
    console.log('🚀 ~ check-for-updates IPC:');
    try {
      const result = await spawnWorker('checkUpdatesWorker', { productId });
      console.log('🚀🚀 ~ IPC result:', result);
      return result;
    } catch (error) {
      console.error('Error in check-for-updates worker:', error);
      throw error;
    }
  },
);

// IPC handler for installing dependencies
ipcMain.handle(
  'install-dependencies',
  async (event, productId: string, callback: Function): Promise<string> => {
    logger('🚀 ~ INSTALL DEPS:', productId);
    try {
      const result = await spawnWorker(
        'installWorker',
        { productId },
        callback,
      );
      console.log('🚀 ~ result:', result);
      return result;
    } catch (error) {
      console.error('Error in install-dependencies worker:', error);
      return {
        success: false,
        message: error.message || 'Failed to install dependencies',
      };
    }
  },
);
ipcMain.on('navigate-to-url', (event, url) => {
  mainWindow?.loadURL(url);
});

// IPC Handler to check Docker containers and run each found container
ipcMain.handle(
  'check-docker-containers',
  async (event, containerNames = containersDefault) => {
    return new Promise((resolve, reject) => {
      // Command to list all containers (running and stopped)
      // console.log('🚀 ~ returnnewPromise ~ process.env:', process.env);
      const dockerPs = spawn('docker', ['ps', '-a', '--format', '{{.Names}}'], {
        env: process.env, // Use system environment variables (including PATH)
      });

      let stdout = '';
      dockerPs.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      dockerPs.stderr.on('data', (data) => {
        console.error(`Error executing command: ${data}`);
      });

      dockerPs.on('close', (code) => {
        if (code !== 0) {
          return reject(
            `Error checking Docker containers: docker ps exited with code ${code}`,
          );
        }

        const allContainers = stdout.split('\n').filter(Boolean);
        const foundContainers = [];

        // Check each specified container
        containerNames.forEach((name) => {
          allContainers.forEach((container) => {
            if (container.includes(name)) {
              foundContainers.push(container); // Add the full container name if it exists
            }
          });
        });

        if (foundContainers.length >= containerNames.length) {
          console.log(
            'All specified containers exist. Starting each container...',
          );

          let allLaunchedSuccessfully = true;
          let processedContainers = 0; // Track processed containers
          console.log(
            '🚀 ~ foundContainers.forEach ~ process.env:',
            process.env,
          );

          // Start each container found
          foundContainers.forEach((container) => {
            const dockerStart = spawn('docker', ['start', container], {
              env: process.env, // Use system environment variables
            });

            dockerStart.stdout.on('data', (data) => {
              console.log(
                `Container ${container} started successfully: ${data}`,
              );
            });

            dockerStart.stderr.on('data', (data) => {
              console.error(`Error starting container ${container}: ${data}`);
              allLaunchedSuccessfully = false;
            });

            dockerStart.on('close', (code) => {
              processedContainers += 1; // Increment processed container count

              if (code !== 0) {
                allLaunchedSuccessfully = false;
              }

              // Check if all containers have been processed
              if (processedContainers === foundContainers.length) {
                if (allLaunchedSuccessfully) {
                  setTimeout(() => {
                    mainWindow!.loadURL(appUrl);
                    initWebSocket();

                    resolve({
                      result: true,
                      details:
                        'All specified containers have been started successfully.',
                    });
                  }, 2000);
                } else {
                  reject({
                    result: false,
                    details: 'Some containers failed to start.',
                  });
                }
              }
            });
          });
        } else {
          console.log('Not all specified containers are found.');
          resolve('Not all specified containers are found.');
        }
      });
    });
  },
);
