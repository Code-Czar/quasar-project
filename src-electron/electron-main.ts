import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  dialog,
  session,
  screen,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import os from 'os';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import AdmZip from 'adm-zip';
import yaml from 'js-yaml';
import WebSocket from 'ws'; // Import the WebSocket library

import { exec, spawn } from 'child_process';

// import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
const isProduction = process.env.NODE_ENV === 'production';

const logFile = fs.createWriteStream('app.log', { flags: 'a' });

const REPO_OWNER = 'Code-Czar';
const REPO_NAME = 'quasar-project';
const ASAR_DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/app-asar.zip`;
const LATEST_YML_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.yml`;
const appUrl = 'http://localhost:9000';

const CURRENT_VERSION = app.getVersion();
const resourcesPath = path.join(app.getPath('userData'), 'app.log');
const asarPath = path.join(resourcesPath, 'app.asar');
const zipPath = path.join(resourcesPath, 'app-asar.zip');
const latestYmlPath = path.join(resourcesPath, 'latest.yml');

const wss = new WebSocket.Server({ port: 8766, host: '0.0.0.0' });

const containersDefault = ['crm-1', 'frontend-1', 'redis-serv-1', 'backend-1'];

app.enableSandbox();

let mainWindow: BrowserWindow | undefined;

let screenWidth;
let screenHeight;

console.log = function (message) {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

autoUpdater.autoDownload = false;
autoUpdater.logger = log;
//@ts-expect-error transport
autoUpdater.logger.transports.file.level = 'info';
console.log('App starting...');

const openWindow = (windowTitle: string, url: string | null = null) => {
  console.log('Action triggered from Quasar frontend!');
  const newWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      sandbox: true,
      devTools: true, // Enable DevTools in production
    },
  });
  newWindow.setTitle(windowTitle);
  newWindow.loadURL(url ?? 'http://tiktok.com');
};

const initWebSocket = () => {
  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      const messageString =
        message instanceof Buffer ? message.toString() : message;

      try {
        // Parse the string as JSON
        // @ts-expect-error ignore
        const data = JSON.parse(messageString);
        console.log('Received:', data);

        // Perform actions based on the received message
        if (data.message === 'open-window') {
          openWindow(data.windowTitle, data.url);
          console.log('Triggering action in Electron app!');
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

async function setPermissions(filePath: string, permissions: number) {
  try {
    await fs.promises.chmod(filePath, permissions);
    console.log(
      `Set permissions for "${filePath}" to ${permissions.toString(8)}`,
    );
  } catch (error) {
    log.error(`Error setting permissions for "${filePath}":`, error);
  }
}

async function getLocalVersion(): Promise<string | undefined> {
  try {
    console.log(`Local path: ${latestYmlPath}`);
    if (fs.existsSync(latestYmlPath)) {
      const ymlContent = fs.readFileSync(latestYmlPath, 'utf-8');
      const parsedYml = yaml.load(ymlContent);
      console.log(`parsed yml: ${parsedYml}`);
      // @ts-expect-error ignoring
      if (parsedYml && parsedYml.version) {
        // @ts-expect-error ignoring
        console.log(`local version: ${parsedYml.version.replace(/^v/, '')}`);
        // @ts-expect-error ignoring
        return parsedYml.version.replace(/^v/, '');
      }
    }
  } catch (error) {
    log.error('Error reading local latest.yml:', error);
    return '';
  }
  console.log(`local version: ${CURRENT_VERSION}`);
  return CURRENT_VERSION;
}

// Helper function to handle worker spawning
function spawnWorker(scriptPath: string, args: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = isProduction
      ? // Production: run the precompiled JS file directly
        spawn(process.execPath, [scriptPath])
      : // Development: run TypeScript file with ts-node
        spawn(process.execPath, [
          '-r',
          'ts-node/register/transpile-only',
          scriptPath,
        ]);

    child.stdin.write(JSON.stringify(args));
    child.stdin.end();

    let result = '';

    child.stdout.on('data', (data) => {
      result += data.toString();
    });

    child.stderr.on('data', (data) => {
      console.error(`Worker error: ${data}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch (err) {
          reject(new Error(`Failed to parse worker result: ${err}`));
        }
      } else {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

async function checkForAppUpdate() {
  try {
    if (!app.isPackaged) {
      console.log('Development mode detected, skipping update check.');
      return;
    }
    const localVersion = await getLocalVersion();
    console.log(`Local version 1: ${localVersion}`);
    await delay(5000);

    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
    );
    const latestVersion = response.data.tag_name.replace(/^v/, '');

    console.log(
      `Local version: ${localVersion}, Latest version: ${latestVersion}`,
    );
    await delay(5000);

    if (latestVersion === localVersion) {
      console.log(
        'Local version matches the latest version. No update needed.',
      );
      return;
    }

    console.log(`New version detected. Prompting user for update...`);
    const dialogOpts: Electron.MessageBoxOptions = {
      type: 'info',
      buttons: ['Download and Install', 'Later'],
      title: 'Update Available',
      message: `A new version (${latestVersion}) is available. Would you like to download and install it?`,
    };

    const { response: userResponse } = await dialog.showMessageBox(dialogOpts);
    if (userResponse === 0) {
      await downloadAndInstallAsar(latestVersion);
    }
  } catch (error) {
    log.error('Error checking for updates:', error);
  }
}

async function downloadAndInstallAsar(latestVersion: string) {
  try {
    console.log(`Starting download of app-asar.zip to "${zipPath}"`);
    const response = await axios({
      url: ASAR_DOWNLOAD_URL,
      method: 'GET',
      responseType: 'stream',
    });
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log(`Downloaded app-asar.zip to "${zipPath}"`);

    console.log(`Starting download of latest.yml to "${latestYmlPath}"`);
    const ymlResponse = await axios({
      url: LATEST_YML_URL,
      method: 'GET',
      responseType: 'stream',
    });
    const ymlWriter = fs.createWriteStream(latestYmlPath);
    ymlResponse.data.pipe(ymlWriter);

    await new Promise<void>((resolve, reject) => {
      ymlWriter.on('finish', resolve);
      ymlWriter.on('error', reject);
    });
    console.log(`Downloaded latest.yml to "${latestYmlPath}"`);

    await setPermissions(zipPath, 0o777);
    await setPermissions(latestYmlPath, 0o644);

    await delay(2000);

    process.noAsar = true;

    console.log(`Starting extraction of "${zipPath}" to "${resourcesPath}"`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(resourcesPath, true);

    const extractedFiles = fs.readdirSync(resourcesPath);
    console.log(
      `Extracted files in resources folder: ${extractedFiles.join(', ')}`,
    );

    if (!fs.existsSync(asarPath)) {
      throw new Error(
        `Extracted file "app.asar" not found in "${resourcesPath}".`,
      );
    }
    console.log(`Found extracted app.asar at "${asarPath}"`);

    await setPermissions(asarPath, 0o755);

    console.log(`Update to version ${latestVersion} completed.`);

    await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart Now'],
      title: 'Update Ready',
      message:
        'The update has been installed. Please restart the app to apply changes.',
    });
    app.relaunch();
    app.exit();
  } catch (error) {
    log.error('Error updating ASAR file:', error);
  }
}

app.whenReady().then(async () => {
  console.log('App is ready, initializing protocols and auto-update check.');
  await checkForAppUpdate();

  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace('app://', '');
    const filePath = path.join(__dirname, urlPath);
    callback({ path: filePath });
  });
});

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
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
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
        console.log('Intercepted URL:', url); // Log the full URL to inspect

        // Parse the fragment (hash) part to extract tokens
        const urlFragment = new URL(url).hash.substring(1); // Remove the `#` symbol
        const fragmentParams = new URLSearchParams(urlFragment);

        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');

        // Log tokens to confirm they are parsed correctly
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);

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
}

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
    const scriptPath = isProduction
      ? path.join(
          process.resourcesPath,
          'dist-electron/installScripts/checkUpdatesWorker.js',
        )
      : path.join(
          __dirname,
          'src-electron/installScripts/checkUpdatesWorker.ts',
        );

    try {
      const result = await spawnWorker(scriptPath, { productId });
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
  async (event, productId: string): Promise<string> => {
    const scriptPath = isProduction
      ? path.join(
          process.resourcesPath,
          'dist-electron/installScripts/installWorker.js',
        )
      : path.join(__dirname, 'src-electron/installScripts/installWorker.ts');

    try {
      const result = await spawnWorker(scriptPath, { productId });
      return result;
    } catch (error) {
      console.error('Error in install-dependencies worker:', error);
      throw error;
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
      exec('docker ps -a --format "{{.Names}}"', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${stderr}`);
          return reject(`Error checking Docker containers: ${error.message}`);
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

        // console.log(
        //   '🚀 ~ allContainers.forEach ~ foundContainers:',
        //   foundContainers
        // );
        if (foundContainers.length >= containerNames.length) {
          console.log(
            'All specified containers exist. Starting each container...',
          );

          // Variable to track if all containers started successfully
          let allLaunchedSuccessfully = true;

          // Start each container found
          foundContainers.forEach((container) => {
            exec(
              `docker start ${container}`,
              (startError, startStdout, startStderr) => {
                if (startError) {
                  console.error(
                    `Error starting container ${container}: ${startStderr}`,
                  );
                  allLaunchedSuccessfully = false; // Set to false if any container fails to start
                } else {
                  console.log(
                    `Container ${container} started successfully:`,
                    startStdout,
                  );
                }

                // Check if all containers have been processed
                if (
                  foundContainers.indexOf(container) ===
                  foundContainers.length - 1
                ) {
                  if (allLaunchedSuccessfully) {
                    mainWindow!.loadURL(appUrl);
                    initWebSocket();

                    resolve({
                      result: true,
                      details:
                        'All specified containers have been started successfully.',
                    });
                  } else {
                    reject({
                      result: false,
                      details: 'Some containers failed to start.',
                    });
                  }
                }
              },
            );
          });
        } else {
          console.log('Not all specified containers are found.');
          resolve('Not all specified containers are found.');
        }
      });
    });
  },
);
