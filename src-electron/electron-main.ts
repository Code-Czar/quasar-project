import { app, BrowserWindow, ipcMain, protocol, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import os from 'os';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import AdmZip from 'adm-zip';
import yaml from 'js-yaml';
import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
const REPO_OWNER = 'Code-Czar';
const REPO_NAME = 'quasar-project';
const ASAR_DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/app-asar.zip`;
const LATEST_YML_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.yml`;

const CURRENT_VERSION = app.getVersion();
const resourcesPath = process.resourcesPath;
const asarPath = path.join(resourcesPath, 'app.asar');
const zipPath = path.join(resourcesPath, 'app-asar.zip');
const latestYmlPath = path.join(resourcesPath, 'latest.yml');

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
    icon: path.resolve(__dirname, 'icons/icon.png'),
    width: 1920,
    height: 1080,
    fullscreen: true, // Start in fullscreen mode
    frame: false, // Remove window frame for a frameless app
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
