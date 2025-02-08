import { app, BrowserWindow, protocol, screen, session, net } from 'electron';
import { execSync } from 'child_process';

import path from 'path';
import fs from 'fs';

// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
import { initializeAutoUpdater } from './installScripts/autoUpdate';
import { initializeIpcHandlers } from './installScripts/ipcHandlers';
import { setWindowCallback } from './installScripts/websocket';

import { logger as log } from './installScripts/logger';

import { extractZip } from './installScripts/utils';

// Extension IDs and filenames
const EXTENSIONS = {
  UBLOCK: {
    id: 'uBlock0_1.62.1b1.chromium',
    zipName: 'uBlock0_1.62.1b1.chromium.zip',
    downloadUrl:
      'https://github.com/gorhill/uBlock/releases/download/1.62.1b1/uBlock0_1.62.1b1.chromium.zip',
  },
  GHOSTERY: {
    id: 'ghostery-chromium-10.4.23',
    zipName: 'ghostery-chromium-10.4.23.zip',
    downloadUrl:
      'https://github.com/ghostery/ghostery-extension/releases/download/v10.4.23/ghostery-chromium-10.4.23.zip',
  },
};

// Add command line switches before anything else
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('enable-extensions');
app.commandLine.appendSwitch('remote-debugging-port', '9222');
app.commandLine.appendSwitch(
  'enable-features',
  'ExtensionsToolbarMenu,ChromeExtensionAPI',
);
app.commandLine.appendSwitch('enable-api', 'runtime');
app.setAsDefaultProtocolClient('infinityinstaller');

// Function to get extension paths
const getExtensionPaths = () => {
  const extensionsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'extensions')
    : path.join(__dirname, '..', 'extensions');

  return {
    ublock: path.join(extensionsDir, EXTENSIONS.UBLOCK.id),
    ghostery: path.join(extensionsDir, EXTENSIONS.GHOSTERY.id),
  };
};

// Only add load-extension switch if the extensions exist
const paths = getExtensionPaths();
if (fs.existsSync(paths.ublock) || fs.existsSync(paths.ghostery)) {
  const existingPaths = [
    fs.existsSync(paths.ublock) ? paths.ublock : '',
    fs.existsSync(paths.ghostery) ? paths.ghostery : '',
  ].filter(Boolean);

  if (existingPaths.length > 0) {
    app.commandLine.appendSwitch('load-extension', existingPaths.join(','));
  }
}

// Function to download file
async function downloadFile(
  url: string,
  destinationPath: string,
): Promise<boolean> {
  try {
    const response = await net.fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = await response.arrayBuffer();

    // Write to a temporary file first
    const tempPath = `${destinationPath}.tmp`;
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Then rename it to the final destination
    fs.renameSync(tempPath, destinationPath);
    console.log(`Successfully downloaded: ${destinationPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    return false;
  }
}

// Function to extract zip if needed
const extractZipIfNeeded = async (
  extensionsDir: string,
  extInfo: { id: string; zipName: string; downloadUrl: string },
) => {
  const zipPath = path.join(extensionsDir, extInfo.zipName);
  const extPath = path.join(extensionsDir, extInfo.id);

  // If zip doesn't exist, try to download it
  if (!fs.existsSync(zipPath)) {
    console.log(
      `Extension zip not found, downloading from ${extInfo.downloadUrl}...`,
    );
    const downloaded = await downloadFile(extInfo.downloadUrl, zipPath);
    if (!downloaded) {
      console.error(`Failed to download ${extInfo.zipName}`);
      return false;
    }
  }

  // If extension directory doesn't exist but zip does, extract it
  if (!fs.existsSync(extPath) && fs.existsSync(zipPath)) {
    console.log(`Extracting ${extInfo.zipName}...`);
    try {
      await extractZip(zipPath, extPath);
      console.log(`Successfully extracted ${extInfo.zipName} to ${extPath}`);
    } catch (e) {
      console.error(`Failed to extract ${extInfo.zipName}:`, e);
      return false;
    }
  }
  return fs.existsSync(extPath);
};

// Function to find manifest in directory or subdirectories
const findManifestPath = (dirPath: string): string | null => {
  // First check direct path
  const directManifest = path.join(dirPath, 'manifest.json');
  if (fs.existsSync(directManifest)) {
    return directManifest;
  }

  // Check immediate subdirectories
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const subManifest = path.join(itemPath, 'manifest.json');
      if (fs.existsSync(subManifest)) {
        // Found manifest in subdirectory, move all files up one level
        console.log(`Found manifest in subdirectory: ${itemPath}`);
        const files = fs.readdirSync(itemPath);
        files.forEach((file) => {
          const srcPath = path.join(itemPath, file);
          const destPath = path.join(dirPath, file);
          if (!fs.existsSync(destPath)) {
            fs.renameSync(srcPath, destPath);
          }
        });
        fs.rmdirSync(itemPath);
        return path.join(dirPath, 'manifest.json');
      }
    }
  }
  return null;
};

// Function to load extensions
async function loadExtensions(browserWindow: BrowserWindow) {
  const extensionsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'extensions')
    : path.join(__dirname, '..', 'extensions');

  console.log('Loading extensions from:', extensionsDir);
  console.log('Is packaged:', app.isPackaged);

  // Create extensions directory if it doesn't exist
  if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir, { recursive: true });
    console.log('Created extensions directory:', extensionsDir);
  }

  // Check if extensions are unzipped
  const checkAndLoadExtension = async (extInfo: {
    id: string;
    zipName: string;
    downloadUrl: string;
  }) => {
    const extPath = path.join(extensionsDir, extInfo.id);
    console.log(`Processing extension ${extInfo.id}...`);
    console.log('Extension path:', extPath);

    try {
      // Try to extract if needed
      const isExtracted = await extractZipIfNeeded(extensionsDir, extInfo);
      if (!isExtracted) {
        console.error(
          `Extension ${extInfo.id} is not available and couldn't be extracted`,
        );
        return false;
      }

      const manifestPath = findManifestPath(extPath);
      if (!manifestPath) {
        console.error(`Manifest not found for ${extInfo.id}`);
        return false;
      }

      console.log(`Found manifest for ${extInfo.id} at:`, manifestPath);

      // Load extension regardless of packaged state
      try {
        const extension = await session.defaultSession.loadExtension(extPath, {
          allowFileAccess: true,
        });
        console.log(`Successfully loaded extension: ${extension.name}`);
        return true;
      } catch (loadError) {
        console.error(`Failed to load extension ${extInfo.id}:`, loadError);
        return false;
      }
    } catch (e) {
      console.error(`Failed to process ${extInfo.id}:`, e);
      return false;
    }
  };

  // Load extensions sequentially and track results
  try {
    const results = await Promise.all([
      checkAndLoadExtension(EXTENSIONS.UBLOCK),
      checkAndLoadExtension(EXTENSIONS.GHOSTERY),
    ]);

    // Log overall status
    const loadedCount = results.filter(Boolean).length;
    console.log(
      `Successfully loaded ${loadedCount} out of ${results.length} extensions`,
    );

    // List all loaded extensions
    const loadedExtensions = session.defaultSession.getAllExtensions();
    console.log('Currently loaded extensions:', loadedExtensions);

    return loadedCount > 0;
  } catch (error) {
    console.error('Error during extension loading:', error);
    return false;
  }
}

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
  newWindow.loadURL(url || 'http://google.com');
};

// Update createMainWindow to remove auth window references
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
      nodeIntegration: true,
      webviewTag: true,
      additionalArguments: [
        '--enable-features=ExtensionsToolbarMenu,ChromeExtensionAPI',
        '--enable-api=runtime',
      ],
    },
  });

  // Add temporary logging for navigation events
  mainWindow.webContents.on('did-start-navigation', (event: any, url: any) => {
    console.log('Main window - Navigation started:', {
      url,
      currentURL: mainWindow.webContents.getURL(),
    });
  });

  mainWindow.webContents.on('did-navigate', (event: any, url: any) => {
    console.log('Main window - Navigation completed:', {
      url,
      currentURL: mainWindow.webContents.getURL(),
    });
  });

  // Load the app
  const mainURL = app.isPackaged
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';

  console.log('Loading main URL:', mainURL);
  await mainWindow.loadURL(mainURL);

  // Show dev tools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  try {
    setWindowCallback(openWindow);
  } catch (error) {
    console.error('Failed to set window callback:', error);
  }
}

// Keep the protocol handler as is since it's working
app.whenReady().then(() => {
  protocol.handle('infinityinstaller', (request) => {
    console.log('Custom protocol URL:', request.url);

    try {
      // Parse the URL and handle encoding
      const parsedUrl = new URL(request.url);
      console.log('Parsed protocol URL:', parsedUrl);

      // Handle auth callback
      if (parsedUrl.pathname.includes('/auth/callback')) {
        // Get the hash or search params from the URL
        const authData = parsedUrl.hash || parsedUrl.search;
        console.log('Auth data from protocol:', authData);

        // Construct the app URL with the auth data
        const appUrl = app.isPackaged
          ? `file://${path.join(__dirname, 'index.html')}#/auth${authData}`
          : `http://localhost:9300/#/auth${authData}`;

        console.log('Redirecting to app URL:', appUrl);

        if (mainWindow) {
          mainWindow.loadURL(appUrl);
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.focus();
        }
      }
    } catch (error) {
      console.error('Error handling protocol URL:', error);
    }
    return new Response();
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
