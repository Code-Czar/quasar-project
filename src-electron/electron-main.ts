import { app, BrowserWindow, protocol, screen } from 'electron';
import { log } from 'electron-log';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { initializeAutoUpdater } from './installScripts/autoUpdate';
import { initializeIpcHandlers } from './installScripts/ipcHandlers';
import { initWebSocket } from './installScripts/websocket';

export let mainWindow: BrowserWindow | null = null;
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
  initWebSocket(openWindow);
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    // Protocol setup
    const protocolName = 'infinityinstaller';
    const execPath = process.execPath;
    const escapedExecPath = execPath
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    const command = `"${escapedExecPath}" "%1"`;

    const registryScript = `
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\\Software\\Classes\\${protocolName}]
@="URL:Infinity Installer Protocol"
"URL Protocol"=""

[HKEY_CURRENT_USER\\Software\\Classes\\${protocolName}\\shell]

[HKEY_CURRENT_USER\\Software\\Classes\\${protocolName}\\shell\\open]

[HKEY_CURRENT_USER\\Software\\Classes\\${protocolName}\\shell\\open\\command]
@="${command}"
`;

    // Register protocol
    const success = app.setAsDefaultProtocolClient(protocolName);
    if (success) {
      console.log(`${protocolName} protocol successfully registered.`);
    } else {
      console.log(`Failed to register ${protocolName} protocol.`);
    }

    // Log and execute registry script
    console.log('Generated Registry Script:', registryScript);
    const tempRegistryFile = `${require('os').tmpdir()}\\protocol_registry.reg`;
    fs.writeFileSync(tempRegistryFile, registryScript, 'utf-8');

    try {
      execSync(`reg import "${tempRegistryFile}"`, { stdio: 'inherit' });
      console.log('Protocol handler registered successfully.');
    } catch (error: any) {
      console.error('Failed to register protocol handler:', error.message);
    }
  }

  createMainWindow();

  initializeIpcHandlers();
  initializeAutoUpdater(mainWindow);
});

// Single-instance lock to prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    // Handle protocol URL when second instance is invoked
    if (process.platform === 'win32' && argv.length > 1) {
      const url = argv.find((arg) => arg.startsWith('infinityinstaller://'));
      if (url && mainWindow) {
        mainWindow.webContents.send('navigate-to-url', url);
      }
    }

    // Focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    createMainWindow();
  });
}

// Handle macOS deep linking
app.on('open-url', (event, url) => {
  event.preventDefault();
  log(`🚀 open-url event triggered: ${url}`);
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to-url', url);
  }
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation
app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});
