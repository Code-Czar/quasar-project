import { app, BrowserWindow, protocol, screen } from 'electron';
// import { log } from 'electron-log';
import { execSync } from 'child_process';

import path from 'path';
import fs from 'fs';
// import fixPath from 'fix-path';

// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
import { initializeAutoUpdater } from './installScripts/autoUpdate';
import { initializeIpcHandlers } from './installScripts/ipcHandlers';
import { initWebSocket } from './installScripts/websocket';

import { logger as log } from './installScripts/logger';
// import { isDevMode } from './installScripts/utils';

// fixPath();

export let mainWindow: any;
export const appUrl = 'http://localhost:9000';
const mainURL = app.isPackaged
  ? `file://${path.join(__dirname, 'index.html')}`
  : 'http://localhost:9300';

export const containersDefault = [
  'crm-1',
  'frontend-1',
  'redis-serv-1',
  'backend-1',
];

export const isDevMode =
  !app.isPackaged || process.env.NODE_ENV === 'development';

const protocolName = 'infinityinstaller';
const execPath = process.execPath;

const escapedExecPath = execPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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

app.commandLine.appendSwitch('remote-debugging-port', '9222');

if (!app.isDefaultProtocolClient(protocolName)) {
  const success = app.setAsDefaultProtocolClient(protocolName);
  if (success) {
    log(`${protocolName} protocol successfully registered.`);
  } else {
    log(`Failed to register ${protocolName} protocol.`);
  }
}

if (process.platform === 'win32') {
  const protocolRegistryFlagPath = `${app.getPath('userData')}/protocol_registered.flag`;

  if (!fs.existsSync(protocolRegistryFlagPath)) {
    const tempRegistryFile = `${require('os').tmpdir()}\\protocol_registry.reg`;
    fs.writeFileSync(tempRegistryFile, registryScript, 'utf-8');

    try {
      execSync(`reg import "${tempRegistryFile}"`, { stdio: 'inherit' });
      log('Protocol handler registered successfully.');
      fs.writeFileSync(protocolRegistryFlagPath, 'true', 'utf-8'); // Mark as registered
    } catch (error: any) {
      console.error('Failed to register protocol handler:', error.message);
    }
  }
}

// if (!app.requestSingleInstanceLock()) {
//   app.quit(); // Exit the second instance immediately
// }

export const openWindow = (windowTitle: string, url = null) => {
  const newWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    frame: true, // Makes the window borderless
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      devTools: true, // Ensure DevTools are enabled

      // devTools: true, // Ensure DevTools are enabled
    },
  });
  console.log('🚀 ~ openWindow ~ url:', url);
  console.log('🚀 ~ openWindow ~ windowTitle:', windowTitle);
  newWindow.setTitle(windowTitle);
  newWindow.loadURL(url || 'http://tiktok.com');
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    frame: false, // Makes the window borderless

    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      devTools: false, // Ensure DevTools are enabled
    },
  });
  mainWindow.webContents.session.clearCache().then(() => {
    log('Cache cleared successfully.');
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
    const execPath = process.execPath;
    const escapedExecPath = execPath
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    const command = `"${escapedExecPath}" "%1"`;
  }
  if (app.isPackaged) {
    // Define the Supabase redirect URI
    const redirectUri = 'http://localhost/auth/callback';
    const filter = { urls: [`${redirectUri}*`] };
  }

  createMainWindow();
  // log(`Location origin : ${mainWindow.origin.location}`);

  initializeIpcHandlers();
  initializeAutoUpdater(mainWindow);
  // app.commandLine.appendSwitch('remote-debugging-port', '9222');
});

if (!app.requestSingleInstanceLock()) {
  app.quit(); // Quit the second instance immediately
} else {
  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith(`${protocolName}://`));
    if (url && mainWindow) {
      mainWindow.webContents.send('navigate-to-url', url);
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

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
