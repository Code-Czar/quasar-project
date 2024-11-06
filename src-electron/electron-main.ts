import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import axios from 'axios';
import { installDependencies } from './installScripts/install';
import os from 'os';

const platform = process.platform || os.platform();
const frontendURL = 'http://localhost:9300/#/';

// ########################
// ## 1. Electron Setup  ##
// ########################

let mainWindow: BrowserWindow | undefined;

async function initElectron() {
  // Install dependencies before creating the main window
  // try {
  //   console.log('Installing dependencies...');
  //   await installDependencies();
  //   console.log('Dependencies installed successfully');
  // } catch (error) {
  //   console.error(
  //     `Dependency installation failed: ${
  //       error instanceof Error ? error.message : 'Unknown error'
  //     }`
  //   );
  // }

  // const frontendReady = await waitForFrontend();
  // if (!frontendReady) {
  //   app.quit();
  //   return;
  // }

  function createWindow() {
    mainWindow = new BrowserWindow({
      icon: path.resolve(__dirname, 'icons/icon.png'),
      width: 1920,
      height: 1080,
      useContentSize: true,
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js'), // Ensure this path is correct
      },
    });

    mainWindow.loadURL(process.env.APP_URL || 'http://localhost:9000');
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
}

initElectron(); // Start the Electron/Quasar setup

// ########################
// ## 2. IPC Handlers for Installation ##
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

// IPC listener to navigate the main window to the provided URL
ipcMain.on('navigate-to-url', (event, url) => {
  mainWindow?.loadURL(url);
});
