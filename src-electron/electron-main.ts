import { app, BrowserWindow, protocol, screen } from 'electron';
import { log } from 'electron-log';

import path from 'path';
// import fixPath from 'fix-path';

// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
import { initializeAutoUpdater } from './installScripts/autoUpdate';
import { initializeIpcHandlers } from './installScripts/ipcHandlers';
import './installScripts/websocket';

// import { logger as log, isDevMode } from './installScripts/utils';
// import { isDevMode } from './installScripts/utils';

// fixPath();

export let mainWindow: any;
export const appUrl = 'http://localhost:9000';
export const containersDefault = [
  'crm-1',
  'frontend-1',
  'redis-serv-1',
  'backend-1',
];

export const isDevMode =
  !app.isPackaged || process.env.NODE_ENV === 'development';

export const openWindow = (windowTitle: string, url = null) => {
  const newWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });
  newWindow.setTitle(windowTitle);
  newWindow.loadURL(url || 'http://tiktok.com');
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });
  mainWindow.webContents.session.clearCache().then(() => {
    console.log('Cache cleared successfully.');
  });

  const mainURL = app.isPackaged
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';

  mainWindow.loadURL(mainURL);
  // initWebSocket();
}

app.whenReady().then(() => {
  // Register protocol only in production mode

  if (!isDevMode) {
    // protocol.registerSchemesAsPrivileged([
    //   {
    //     scheme: 'infinityinstaller',
    //     privileges: {
    //       secure: true,
    //       standard: true,
    //     },
    //   },
    // ]);
    // Set as default protocol client only in production
    //   app.setAsDefaultProtocolClient('infinityinstaller');
    // }
    // // Windows/Linux protocol handler
    // if (!app.isDefaultProtocolClient('infinityinstaller')) {
    //   app.setAsDefaultProtocolClient('infinityinstaller');
  }

  createMainWindow();

  initializeIpcHandlers();
  initializeAutoUpdater(mainWindow);
});

// app.on('all', (event, ...args: any) => {
//   log(`Global Event Listener: ${event} ${args}`);
// });

// macOS deep link handler
app.on('open-url', (event, url) => {
  // event.preventDefault();
  // log('Received deep link URL:', url);
  log(`🚀 open-url event triggered: ${url}`);

  try {
    mainWindow.webContents.send('navigate-to-url', url);
  } catch (error) {
    log(error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});
