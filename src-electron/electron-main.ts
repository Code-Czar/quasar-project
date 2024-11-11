import { app, BrowserWindow, ipcMain, protocol, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import os from 'os'; // Add this import

import axios from 'axios';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import AdmZip from 'adm-zip';
import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
const REPO_OWNER = 'Code-Czar';
const REPO_NAME = 'quasar-project';
const ASAR_DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/app-asar.zip`;
const CURRENT_VERSION = app.getVersion();

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

async function setPermissions(filePath: string, permissions: number) {
  try {
    await fs.promises.chmod(filePath, permissions);
    log.info(`Set permissions for "${filePath}" to ${permissions.toString(8)}`);
  } catch (error) {
    log.error(`Error setting permissions for "${filePath}":`, error);
  }
}

async function checkForAppUpdate() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );
    const latestVersion = response.data.tag_name;

    if (latestVersion !== `v${CURRENT_VERSION}`) {
      const dialogOpts: Electron.MessageBoxOptions = {
        type: 'info',
        buttons: ['Download and Install', 'Later'],
        title: 'Update Available',
        message: `A new version (${latestVersion}) is available. Would you like to download and install it?`,
      };

      const { response } = await dialog.showMessageBox(dialogOpts);
      if (response === 0) {
        await downloadAndInstallAsar();
      }
    } else {
      log.info('No new updates available.');
    }
  } catch (error) {
    log.error('Error fetching latest release:', error);
  }
}

async function downloadAndInstallAsar() {
  const resourcesPath = process.resourcesPath;
  const asarPath = path.join(resourcesPath, 'app.asar');
  const zipPath = path.join(resourcesPath, 'app-asar.zip');

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

    await setPermissions(zipPath, 0o777);

    await delay(2000); // Ensure the file is ready for extraction

    // Set process.noAsar to true to avoid asar file handling issues
    process.noAsar = true;

    // Extract directly into resourcesPath
    log.info(`Starting extraction of "${zipPath}" to "${resourcesPath}"`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(resourcesPath, true);

    const extractedFiles = fs.readdirSync(resourcesPath);
    log.info(
      `Extracted files in resources folder: ${extractedFiles.join(', ')}`
    );

    const extractedAsarPath = path.join(resourcesPath, 'app.asar');
    if (!fs.existsSync(extractedAsarPath)) {
      throw new Error(
        `Extracted file "app.asar" not found in "${resourcesPath}". Files found: ${extractedFiles.join(
          ', '
        )}`
      );
    }
    log.info(`Found extracted app.asar at "${extractedAsarPath}"`);

    await setPermissions(extractedAsarPath, 0o755);

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

app.whenReady().then(() => {
  log.info('App is ready, initializing protocols and auto-update check.');
  checkForAppUpdate();

  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace('app://', '');
    const filePath = path.join(__dirname, urlPath);
    callback({ path: filePath });
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'),
    width: 1920,
    height: 1080,
    useContentSize: true,
    webPreferences: {
      sandbox: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  mainWindow.loadURL(process.env.APP_URL || 'http://localhost:9300');
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

ipcMain.handle('install-dependencies', async () => {
  try {
    const result = await installDependencies();
    return result;
  } catch (error) {
    throw new Error(
      `Dependency installation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
});

ipcMain.on('navigate-to-url', (event, url) => {
  mainWindow?.loadURL(url);
});
