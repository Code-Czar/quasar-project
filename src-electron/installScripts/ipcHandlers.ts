import path from 'path';
import { app, ipcMain, ipcRenderer, BrowserWindow } from 'electron';
// import { spawnWorker } from './workerUtils';
// import { mainWindow, appUrl, openWindow, initWebSocket, containersDefault } from './main';
import { delay } from './utils';
// import { logger as log } from './utils';
import {
  getCurrentVersion,
  checkForUpdates,
  installSoftwareUpdate,
} from './autoUpdate';

const DOWNLOAD_DIR = path.dirname(app.getAppPath());

export const initializeIpcHandlers = () => {
  ipcMain.handle(
    'check-for-updates',
    async (event, productName, requestPlatform, requestArch) => {
      console.log('🚀 ~ ipcMain.handle ~ event:', productName);

      const currentVersion = await getCurrentVersion();
      console.log('🚀 ~ ipcMain.handle ~ currentVersion:', currentVersion);
      const updates = await checkForUpdates(
        productName,
        false,
        DOWNLOAD_DIR,
        requestPlatform,
        requestArch,
      );
      console.log('🚀 ~ ipcMain.handle ~ updates:', updates);
    },
  );
  ipcMain.handle(
    'install-software-update',
    async (event, productName, requestPlatform, requestArch) => {
      // console.log('🚀 ~ ipcMain.handle ~ event:', productName);

      await installSoftwareUpdate(productName, requestPlatform, requestArch);
    },
  );
};
