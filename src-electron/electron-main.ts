import { app, BrowserWindow, protocol, screen, session, net } from 'electron';
// import { log } from 'electron-log';
import { execSync } from 'child_process';

import path from 'path';
import fs from 'fs';
// import fixPath from 'fix-path';

// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
import { initializeAutoUpdater } from './installScripts/autoUpdate';
import { initializeIpcHandlers } from './installScripts/ipcHandlers';
import { setWindowCallback } from './installScripts/websocket';

import { logger as log } from './installScripts/logger';
// import { isDevMode } from './installScripts/utils';

// Extension IDs and filenames
const EXTENSIONS = {
  UBLOCK: {
    id: 'uBlock0_1.62.1b1.chromium',
    zipName: 'uBlock0_1.62.1b1.chromium.zip',
  },
  GHOSTERY: {
    id: 'ghostery-chromium-10.4.23',
    zipName: 'ghostery-chromium-10.4.23.zip',
  },
};

// Function to load extensions
async function loadExtensions(browserWindow: BrowserWindow) {
  const extensionsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'extensions')
    : path.join(__dirname, '..', 'extensions');

  console.log('Loading extensions from:', extensionsDir);

  // Add keyboard shortcut to check extensions
  browserWindow.webContents.on(
    'before-input-event',
    (event: Electron.Event, input: Electron.Input) => {
      if (
        (input.control || input.meta) &&
        input.shift &&
        input.key.toLowerCase() === 'e'
      ) {
        const extensions = browserWindow.webContents.session.getAllExtensions();
        console.log('Currently loaded extensions:', extensions);

        // Create a simple HTML page to show extensions status
        const html = `
          <html>
            <head>
              <title>Extensions Status</title>
              <style>
                body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                .extension { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <h2>Loaded Extensions</h2>
              ${
                extensions.length
                  ? extensions
                      .map(
                        (ext) => `
                <div class="extension">
                  <h3>${ext.name}</h3>
                  <p>Version: ${ext.version}</p>
                  <p>ID: ${ext.id}</p>
                </div>
              `,
                      )
                      .join('')
                  : '<p>No extensions loaded</p>'
              }
              <hr>
              <h3>Extensions Directory</h3>
              <p>${extensionsDir}</p>
            </body>
          </html>
        `;

        // Create a new window to display extensions info
        const extensionsWindow = new BrowserWindow({
          width: 600,
          height: 400,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });

        extensionsWindow.loadURL(
          'data:text/html;charset=utf-8,' + encodeURIComponent(html),
        );
      }
    },
  );

  // Check if extensions are unzipped
  const checkAndLoadExtension = async (extInfo: {
    id: string;
    zipName: string;
  }) => {
    const extPath = path.join(extensionsDir, extInfo.id);

    if (!fs.existsSync(extPath)) {
      console.error(`Extension directory not found: ${extPath}`);
      return;
    }

    try {
      const extension = await browserWindow.webContents.session.loadExtension(
        extPath,
        {
          allowFileAccess: true,
        },
      );
      console.log(`${extInfo.id} loaded successfully:`, {
        name: extension.name,
        version: extension.version,
        id: extension.id,
      });
    } catch (e) {
      console.error(`Failed to load ${extInfo.id}:`, e);
    }
  };

  // Load both extensions
  await checkAndLoadExtension(EXTENSIONS.UBLOCK);
  await checkAndLoadExtension(EXTENSIONS.GHOSTERY);
}

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

const getPreloadPath = () => {
  const preloadFileName = 'electron-preload.js';
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', preloadFileName)
    : path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD);
};

export const openWindow = async (windowTitle: string, url = null) => {
  const newWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    frame: true,
    resizable: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: getPreloadPath(),
      devTools: true,
      partition: 'persist:main',
      // Enable Chrome extensions
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  // Load extensions before configuring session
  await loadExtensions(newWindow);

  // Add keyboard shortcut to directly check extensions
  newWindow.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Shift+E or Cmd+Shift+E to check extensions
    if (
      (input.control || input.meta) &&
      input.shift &&
      input.key.toLowerCase() === 'e'
    ) {
      newWindow.webContents
        .executeJavaScript(
          `
        chrome.management.getAll((extensions) => {
          console.log('Loaded Extensions:', extensions);
        });
      `,
        )
        .catch((err) => console.error('Failed to check extensions:', err));
    }
  });

  // Configure session only for this new window
  const sess = newWindow.webContents.session;
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
    delete details.requestHeaders['Electron'];
    callback({ requestHeaders: details.requestHeaders });
  });

  console.log('🚀 ~ openWindow ~ url:', url);
  console.log('🚀 ~ openWindow ~ windowTitle:', windowTitle);
  newWindow.loadURL(url || 'http://tiktok.com');

  // Listen for the page title change event and override it
  newWindow.webContents.on('page-title-updated', (event) => {
    event.preventDefault(); // Prevent the default behavior
    newWindow.webContents
      .executeJavaScript(`document.title = ${JSON.stringify(windowTitle)};`)
      .then(() => {
        console.log('🚀 ~ Page title set to:', windowTitle);
      })
      .catch((error) => {
        console.error('🚀 ~ Error setting page title:', error);
      });
  });
};

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: getPreloadPath(),
      devTools: true,
      webSecurity: false,
      partition: 'persist:main',
      // Enable Chrome extensions
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  // Add keyboard shortcut to directly check extensions
  mainWindow.webContents.on(
    'before-input-event',
    (event: Electron.Event, input: Electron.Input) => {
      // Ctrl+Shift+E or Cmd+Shift+E to check extensions
      if (
        (input.control || input.meta) &&
        input.shift &&
        input.key.toLowerCase() === 'e'
      ) {
        mainWindow.webContents
          .executeJavaScript(
            `
          chrome.management.getAll((extensions) => {
            console.log('Loaded Extensions:', extensions);
          });
        `,
          )
          .catch((err: Error) =>
            console.error('Failed to check extensions:', err),
          );
      }
    },
  );

  // Load extensions before loading the URL
  await loadExtensions(mainWindow);

  mainWindow.webContents.session.clearCache().then(() => {
    log('Cache cleared successfully.');
  });

  const mainURL = app.isPackaged
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';

  mainWindow.loadURL(mainURL);
  try {
    setWindowCallback(openWindow);
  } catch (error) {}
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

  // Register chrome-extension protocol without interfering with Supabase
  protocol.handle('chrome-extension', (request) => {
    const url = request.url.substring('chrome-extension://'.length);
    const extensionParts = url.split('/');
    const extensionId = extensionParts[0];
    const extensionPath = app.isPackaged
      ? path.join(process.resourcesPath, 'extensions', extensionId)
      : path.join(__dirname, '..', 'extensions', extensionId);

    const filePath = path.join(extensionPath, ...extensionParts.slice(1));
    return net.fetch(`file://${filePath}`);
  });

  createMainWindow();
  initializeIpcHandlers(mainWindow);
  initializeAutoUpdater(mainWindow);
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
