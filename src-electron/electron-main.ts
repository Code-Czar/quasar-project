import { app, BrowserWindow, ipcMain, protocol, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { URL } from 'url';
import os from 'os';
import path from 'path';
import log from 'electron-log';
import { installDependencies } from './installScripts/install';

const platform = process.platform || os.platform();
let mainWindow: BrowserWindow | undefined;

// ########################
// ## Auto-Updater Setup ##
// ########################

autoUpdater.autoDownload = false; // Set to false for user confirmation before download

// Set up logging for the auto-updater
autoUpdater.logger = log;
//@ts-expect-error transport
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Configure GitHub provider for auto-updater
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'Code-Czar',
  repo: 'quasar-project',
  private: false, // If the repo is public; if private, provide a GitHub token
});

autoUpdater.on('update-available', () => {
  const dialogOpts: Electron.MessageBoxOptions = {
    type: 'info',
    buttons: ['Download Now', 'Later'],
    title: 'Update Available',
    message: 'A new version is available. Download and install now?',
  };

  dialog.showMessageBox(dialogOpts).then((result) => {
    if (result.response === 0) {
      // User chose to download
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  const dialogOpts: Electron.MessageBoxOptions = {
    type: 'info',
    buttons: ['Restart Now', 'Later'],
    title: 'Update Ready',
    message: 'An update has been downloaded. Restart to apply the update?',
  };

  dialog.showMessageBox(dialogOpts).then((result) => {
    if (result.response === 0) {
      // User chose to restart
      autoUpdater.quitAndInstall();
    }
  });
});

// ########################
// ## Electron Protocols ##
// ########################

app.whenReady().then(() => {
  log.info('App is ready, initializing protocols and auto-update check.');
  autoUpdater.checkForUpdatesAndNotify(); // Automatically check for updates and notify

  protocol.registerFileProtocol('app', (request, callback) => {
    const urlPath = request.url.replace('app://', ''); // Strip the custom protocol prefix
    const filePath = path.normalize(`${__dirname}/${urlPath}`);
    callback({ path: filePath });
  });
});

// ########################
// ## Browser Window Setup ##
// ########################

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'),
    width: 1920,
    height: 1080,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
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

// ########################
// ## IPC Handlers for Installation ##
// ########################

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
