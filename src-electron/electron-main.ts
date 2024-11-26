import { app, BrowserWindow, protocol, screen } from 'electron';
import { initializeAutoUpdater } from './autoUpdate';
import { initializeIpcHandlers } from './ipcHandlers';
import { logger as log } from './utils';

import './websocket';
import path from 'path';
import fixPath from 'fix-path';
fixPath();

export let mainWindow;
export const appUrl = 'http://localhost:9000';
export const containersDefault = [
  'crm-1',
  'frontend-1',
  'redis-serv-1',
  'backend-1',
];

export const openWindow = (windowTitle, url = null) => {
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
  const isDevMode = !app.isPackaged || process.env.NODE_ENV === 'development';

  // Register protocol only in production mode
  if (!isDevMode) {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'infinityinstaller',
        privileges: {
          secure: true,
          standard: true,
        },
      },
    ]);

    // Set as default protocol client only in production
    app.setAsDefaultProtocolClient('infinityinstaller');
  }
  createMainWindow();
  // checkForUpdates();
  initializeAutoUpdater(mainWindow);
  initializeIpcHandlers();
});

app.on('all', (event, ...args) => {
  log('Global Event Listener:', event, args);
});

// macOS deep link handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  // log('Received deep link URL:', url);
  log(`🚀 open-url event triggered: ${url}`);
  const queryParams = new URL(url).searchParams;
  const routePath = '/auth'; // Adjust this based on your route configuration
  const accessToken = queryParams.get('access_token');
  log('🚀 ~ app.on ~ accessToken:', accessToken);

  // if (mainWindow) {
  //   mainWindow.webContents.executeJavaScript(`
  //   window.router.push push({
  //     path: ${routePath},
  //     query: { token: ${accessToken} },
  //   });
  // `);
  // mainWindow.router.push({
  //   path: routePath,
  //   query: { token: accessToken },
  // });
  // }

  // // If you have a main window, you can use it to navigate
  // // const mainWindow = BrowserWindow.getAllWindows()[0];
  // // if (mainWindow) {
  log(mainWindow.webContents);
  log(mainWindow?.webContents?.electronAPI);
  log(mainWindow?.electronAPI);
  try {
    mainWindow.webContents.send('navigate-to-url', url);
  } catch (error) {
    log(error);
  } finally {
    mainWindow.webContents.electronAPI?.navigateTo(url);
    mainWindow.electronAPI?.navigateTo(url);
  }

  // mainWindow.webContents.executeJavaScript(`
  //   window.location.href = '/auth'
  // `);
  // }
});

// Windows/Linux protocol handler
if (!app.isDefaultProtocolClient('infinityinstaller')) {
  app.setAsDefaultProtocolClient('infinityinstaller');
}

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
