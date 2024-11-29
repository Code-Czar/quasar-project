import path from 'path';
import { app, ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import { delay } from './utils';
import { logger as log } from './logger';
import {
  getCurrentVersion,
  checkForUpdates,
  installSoftwareUpdate,
  launchSoftware,
} from './autoUpdate';

// const DOWNLOAD_DIR = path.dirname(app.getAppPath());

export const initializeIpcHandlers = () => {
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
      // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

      await installSoftwareUpdate(productName, requestPlatform, requestArch);
    },
  );
  ipcMain.handle('launch-software', async (event, productName) => {
    // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

    await launchSoftware(productName);
  });
};
