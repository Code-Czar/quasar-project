import path from 'path';
import { app, ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import { delay } from './utils';
import { logger as log } from './logger';
import {
  getCurrentVersion,
  checkForUpdates,
  installSoftwareUpdate,
  launchSoftware,
  autoUpdateInstaller,
  killSoftware,
} from './autoUpdate';

// const DOWNLOAD_DIR = path.dirname(app.getAppPath());

export const initializeIpcHandlers = (mainWindow: any) => {
  // console.log('Initializing IPC Handlers...');
  log("🚀 ~ initializeIpcHandlers ~ 'Initializing IPC Handlers...':");

  ipcMain.handle('check-installer-updates', async (event) => {
    await autoUpdateInstaller();
  });
  ipcMain.handle(
    'check-for-updates',
    async (event, productName, requestPlatform, requestArch) => {
      log(` Checking updates for : ${productName}`);

      const currentVersion = await getCurrentVersion();
      log(` Current version : ${currentVersion}`);

      const updates = await checkForUpdates(productName);
      log(` Check updates result : ${currentVersion}`);
      return updates;
    },
  );
  ipcMain.handle(
    'install-software-update',
    async (event, productName, requestPlatform, requestArch) => {
      console.log('🚀 ~ requestArch:', requestArch);
      console.log('🚀 ~ requestPlatform:', requestPlatform);
      console.log('🚀 ~ productName:', productName);
      // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

      await installSoftwareUpdate(productName, requestPlatform, requestArch);
    },
  );
  ipcMain.handle('launch-software', async (event, productName) => {
    // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

    await launchSoftware(productName);
  });
  ipcMain.handle('kill-software', async (event, productName) => {
    // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

    await killSoftware(productName);
  });

  ipcMain.on('protocol-invoked', (event, url) => {
    console.log('🚀 Protocol Invoked URL:', url);

    // Ensure the protocol is valid
    if (
      url.startsWith('infinityinstaller://') &&
      url.includes('subscription_success')
    ) {
      const allWindows = BrowserWindow.getAllWindows();
      const mainWindow = allWindows.find((win) =>
        win.webContents.getURL().includes('index.html'),
      ); // Adjust for your main window

      // Send the event to the renderer process of the main window
      if (mainWindow) {
        mainWindow.webContents.send('navigate-to-url', url);
      }

      // Close the window that opened Stripe checkout
      const stripeWindow = allWindows.find((win) => win !== mainWindow); // Any window that's not mainWindow
      if (stripeWindow) {
        stripeWindow.close();
      }
    } else {
      console.error('Invalid protocol or URL:', url);
    }
  });
  // Handle Stripe-related operations
  ipcMain.handle('handle-stripe', (event, { action, redirectUrl, url }) => {
    // const baseURL = mainWindow.webContents.getURL(); // Fetch the full URL
    // const baseURL = `file://${mainWindow.location.pathname}`;
    const sessionId =
      url.split('session_id=').length > 1 ? url.split('session_id=')[1] : null;
    const indexPath = `file://${path.join(
      app.getAppPath(),
      'index.html',
    )}#/subscription_success?session_id=${sessionId}`;

    const baseURL = indexPath; //new URL(mainWindow.webContents.getURL()).origin;

    log(`Base URL: ${baseURL}`);

    // Extract only the base path if necessary
    // const parsedURL = new URL(baseURL);
    const basePath = `${baseURL}`;

    log(`Base Path: ${basePath}`);
    const allWindows = BrowserWindow.getAllWindows();

    // Identify the Stripe window
    const stripeWindow = allWindows.find(
      (win) => win !== mainWindow, // Assuming the Stripe window is not the main window
    );

    // Redirect the main window
    if (mainWindow && action === 'redirect') {
      mainWindow.loadURL(`${basePath}`); // Load the desired URL
      log(`Main window redirected to ${redirectUrl}`);
    }

    if (stripeWindow) {
      // stripeWindow.loadURL(`${basePath}/${redirectUrl}`);
      // stripeWindow.close(); // Close the Stripe window
      log('Stripe window closed.');
    }
  });
};
