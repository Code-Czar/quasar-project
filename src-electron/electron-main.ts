import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  dialog,
  session,
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

import { exec, fork } from 'child_process';

// import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
const REPO_OWNER = 'Code-Czar';
const REPO_NAME = 'quasar-project';
const ASAR_DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/app-asar.zip`;
const LATEST_YML_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.yml`;
const appUrl = 'http://localhost:9000';

const CURRENT_VERSION = app.getVersion();
const resourcesPath = process.resourcesPath;
const asarPath = path.join(resourcesPath, 'app.asar');
const zipPath = path.join(resourcesPath, 'app-asar.zip');
const latestYmlPath = path.join(resourcesPath, 'latest.yml');

const wss = new WebSocket.Server({ port: 8766, host: '0.0.0.0' });

const containersDefault = ['crm-1', 'frontend-1', 'redis-serv-1', 'backend-1'];

app.enableSandbox();

let mainWindow: BrowserWindow | undefined;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

autoUpdater.autoDownload = false;
autoUpdater.logger = log;
//@ts-expect-error transport
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const openWindow = (windowTitle: string, url: string | null = null) => {
  console.log('Action triggered from Quasar frontend!');
  const newWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      sandbox: true,
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
    log.info(`Set permissions for "${filePath}" to ${permissions.toString(8)}`);
  } catch (error) {
    log.error(`Error setting permissions for "${filePath}":`, error);
  }
}

async function getLocalVersion(): Promise<string | undefined> {
  try {
    log.info(`Local path: ${latestYmlPath}`);
    if (fs.existsSync(latestYmlPath)) {
      const ymlContent = fs.readFileSync(latestYmlPath, 'utf-8');
      const parsedYml = yaml.load(ymlContent);
      log.info(`parsed yml: ${parsedYml}`);
      // @ts-expect-error ignoring
      if (parsedYml && parsedYml.version) {
        // @ts-expect-error ignoring
        log.info(`local version: ${parsedYml.version.replace(/^v/, '')}`);
        // @ts-expect-error ignoring
        return parsedYml.version.replace(/^v/, '');
      }
    }
  } catch (error) {
    log.error('Error reading local latest.yml:', error);
    return '';
  }
  log.info(`local version: ${CURRENT_VERSION}`);
  return CURRENT_VERSION;
}

async function checkForAppUpdate() {
  try {
    if (!app.isPackaged) {
      log.info('Development mode detected, skipping update check.');
      return;
    }
    const localVersion = await getLocalVersion();
    log.info(`Local version 1: ${localVersion}`);
    await delay(5000);

    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );
    const latestVersion = response.data.tag_name.replace(/^v/, '');

    log.info(
      `Local version: ${localVersion}, Latest version: ${latestVersion}`
    );
    await delay(5000);

    if (latestVersion === localVersion) {
      log.info('Local version matches the latest version. No update needed.');
      return;
    }

    log.info(`New version detected. Prompting user for update...`);
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
    log.info(`Starting download of app-asar.zip to "${zipPath}"`);
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
    log.info(`Downloaded app-asar.zip to "${zipPath}"`);

    log.info(`Starting download of latest.yml to "${latestYmlPath}"`);
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
    log.info(`Downloaded latest.yml to "${latestYmlPath}"`);

    await setPermissions(zipPath, 0o777);
    await setPermissions(latestYmlPath, 0o644);

    await delay(2000);

    process.noAsar = true;

    log.info(`Starting extraction of "${zipPath}" to "${resourcesPath}"`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(resourcesPath, true);

    const extractedFiles = fs.readdirSync(resourcesPath);
    log.info(
      `Extracted files in resources folder: ${extractedFiles.join(', ')}`
    );

    if (!fs.existsSync(asarPath)) {
      throw new Error(
        `Extracted file "app.asar" not found in "${resourcesPath}".`
      );
    }
    log.info(`Found extracted app.asar at "${asarPath}"`);

    await setPermissions(asarPath, 0o755);

    log.info(`Update to version ${latestVersion} completed.`);

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
  log.info('App is ready, initializing protocols and auto-update check.');
  await checkForAppUpdate();

  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace('app://', '');
    const filePath = path.join(__dirname, urlPath);
    callback({ path: filePath });
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true, // Start in fullscreen mode
    frame: false, // Remove the window frame for a borderless look
    resizable: false, // Optional: Prevent resizing if you want a fixed size
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
    },
  });

  const mainURL = app.isPackaged
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';
  mainWindow.loadURL(mainURL);

  if (app.isPackaged) {
    // Define the Supabase redirect URI
    const redirectUri = 'http://localhost/auth/callback';
    const filter = { urls: [`${redirectUri}*`] };

    session.defaultSession.webRequest.onBeforeRequest(
      filter,
      (details, callback) => {
        const url = details.url;
        log.info('Intercepted URL:', url); // Log the full URL to inspect

        // Parse the fragment (hash) part to extract tokens
        const urlFragment = new URL(url).hash.substring(1); // Remove the `#` symbol
        const fragmentParams = new URLSearchParams(urlFragment);

        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');

        // Log tokens to confirm they are parsed correctly
        log.info('Access Token:', accessToken);
        log.info('Refresh Token:', refreshToken);

        if (accessToken) {
          // Redirect to index.html#/auth with tokens as query parameters
          mainWindow!.loadURL(
            `${mainURL}#/auth?access_token=${accessToken}&refresh_token=${refreshToken}`
          );
        }

        // Cancel the original request to prevent navigation
        callback({ cancel: true });
      }
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

ipcMain.handle(
  'check-for-updates',
  async (
    event,
    productId: string
  ): Promise<{
    shouldUpdate: boolean;
    latestVersion?: string;
    error?: string;
  }> => {
    return new Promise((resolve, reject) => {
      const updateProcess = fork(
        'src-electron/installScripts/checkUpdatesWorker.ts',
        [],
        {
          execArgv: ['-r', 'ts-node/register/transpile-only'], // Use ts-node with transpile-only
        }
      );

      updateProcess.send({ productId });

      updateProcess.on('message', (result) => {
        resolve(result); // Resolve with the update check result
      });

      updateProcess.on('error', (error) => {
        reject(error);
      });

      updateProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Update check process exited with code ${code}`));
        }
      });
    });
  }
);

// Define the handler for 'install-dependencies'
ipcMain.handle(
  'install-dependencies',
  async (event, productId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const installerProcess = fork(
        'src-electron/installScripts/installWorker.ts',
        [],
        {
          execArgv: ['-r', 'ts-node/register/transpile-only'], // Use ts-node with transpile-only to ignore TypeScript errors
        }
      );

      installerProcess.send({ productId });

      installerProcess.on('message', (result: string) => {
        resolve(result);
      });
      installerProcess.on('error', (error) => {
        reject(error);
      });
      installerProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Installer process exited with code ${code}`));
        }
      });
    });
  }
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
            'All specified containers exist. Starting each container...'
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
                    `Error starting container ${container}: ${startStderr}`
                  );
                  allLaunchedSuccessfully = false; // Set to false if any container fails to start
                } else {
                  console.log(
                    `Container ${container} started successfully:`,
                    startStdout
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
              }
            );
          });
        } else {
          console.log('Not all specified containers are found.');
          resolve('Not all specified containers are found.');
        }
      });
    });
  }
);
