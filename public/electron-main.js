"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWindow = exports.isDevMode = exports.containersDefault = exports.appUrl = exports.mainWindow = void 0;
const electron_1 = require("electron");
// import { log } from 'electron-log';
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// import fixPath from 'fix-path';
// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
const autoUpdate_1 = require("./installScripts/autoUpdate");
const ipcHandlers_1 = require("./installScripts/ipcHandlers");
const websocket_1 = require("./installScripts/websocket");
const logger_1 = require("./installScripts/logger");
// import { isDevMode } from './installScripts/utils';
const utils_1 = require("./installScripts/utils");
// Extension IDs and filenames
const EXTENSIONS = {
    UBLOCK: {
        id: 'uBlock0_1.62.1b1.chromium',
        zipName: 'uBlock0_1.62.1b1.chromium.zip',
        downloadUrl: 'https://github.com/gorhill/uBlock/releases/download/1.62.1b1/uBlock0_1.62.1b1.chromium.zip',
    },
    GHOSTERY: {
        id: 'ghostery-chromium-10.4.23',
        zipName: 'ghostery-chromium-10.4.23.zip',
        downloadUrl: 'https://github.com/ghostery/ghostery-extension/releases/download/v10.4.23/ghostery-chromium-10.4.23.zip',
    },
};
// Add command line switches before anything else
electron_1.app.commandLine.appendSwitch('no-sandbox');
electron_1.app.commandLine.appendSwitch('disable-site-isolation-trials');
electron_1.app.commandLine.appendSwitch('ignore-certificate-errors');
electron_1.app.commandLine.appendSwitch('enable-extensions');
electron_1.app.commandLine.appendSwitch('remote-debugging-port', '9222');
electron_1.app.commandLine.appendSwitch('enable-features', 'ExtensionsToolbarMenu,ChromeExtensionAPI');
electron_1.app.commandLine.appendSwitch('enable-api', 'runtime');
// Function to get extension paths
const getExtensionPaths = () => {
    const extensionsDir = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'extensions')
        : path_1.default.join(__dirname, '..', 'extensions');
    return {
        ublock: path_1.default.join(extensionsDir, EXTENSIONS.UBLOCK.id),
        ghostery: path_1.default.join(extensionsDir, EXTENSIONS.GHOSTERY.id),
    };
};
// Only add load-extension switch if the extensions exist
const paths = getExtensionPaths();
if (fs_1.default.existsSync(paths.ublock) || fs_1.default.existsSync(paths.ghostery)) {
    const existingPaths = [
        fs_1.default.existsSync(paths.ublock) ? paths.ublock : '',
        fs_1.default.existsSync(paths.ghostery) ? paths.ghostery : '',
    ].filter(Boolean);
    if (existingPaths.length > 0) {
        electron_1.app.commandLine.appendSwitch('load-extension', existingPaths.join(','));
    }
}
// Function to download file
async function downloadFile(url, destinationPath) {
    try {
        const response = await electron_1.net.fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        // Write to a temporary file first
        const tempPath = `${destinationPath}.tmp`;
        fs_1.default.writeFileSync(tempPath, Buffer.from(buffer));
        // Then rename it to the final destination
        fs_1.default.renameSync(tempPath, destinationPath);
        console.log(`Successfully downloaded: ${destinationPath}`);
        return true;
    }
    catch (error) {
        console.error(`Failed to download ${url}:`, error);
        return false;
    }
}
// Function to extract zip if needed
const extractZipIfNeeded = async (extensionsDir, extInfo) => {
    const zipPath = path_1.default.join(extensionsDir, extInfo.zipName);
    const extPath = path_1.default.join(extensionsDir, extInfo.id);
    // If zip doesn't exist, try to download it
    if (!fs_1.default.existsSync(zipPath)) {
        console.log(`Extension zip not found, downloading from ${extInfo.downloadUrl}...`);
        const downloaded = await downloadFile(extInfo.downloadUrl, zipPath);
        if (!downloaded) {
            console.error(`Failed to download ${extInfo.zipName}`);
            return false;
        }
    }
    // If extension directory doesn't exist but zip does, extract it
    if (!fs_1.default.existsSync(extPath) && fs_1.default.existsSync(zipPath)) {
        console.log(`Extracting ${extInfo.zipName}...`);
        try {
            await (0, utils_1.extractZip)(zipPath, extPath);
            console.log(`Successfully extracted ${extInfo.zipName} to ${extPath}`);
        }
        catch (e) {
            console.error(`Failed to extract ${extInfo.zipName}:`, e);
            return false;
        }
    }
    return fs_1.default.existsSync(extPath);
};
// Function to find manifest in directory or subdirectories
const findManifestPath = (dirPath) => {
    // First check direct path
    const directManifest = path_1.default.join(dirPath, 'manifest.json');
    if (fs_1.default.existsSync(directManifest)) {
        return directManifest;
    }
    // Check immediate subdirectories
    const items = fs_1.default.readdirSync(dirPath);
    for (const item of items) {
        const itemPath = path_1.default.join(dirPath, item);
        if (fs_1.default.statSync(itemPath).isDirectory()) {
            const subManifest = path_1.default.join(itemPath, 'manifest.json');
            if (fs_1.default.existsSync(subManifest)) {
                // Found manifest in subdirectory, move all files up one level
                console.log(`Found manifest in subdirectory: ${itemPath}`);
                const files = fs_1.default.readdirSync(itemPath);
                files.forEach((file) => {
                    const srcPath = path_1.default.join(itemPath, file);
                    const destPath = path_1.default.join(dirPath, file);
                    if (!fs_1.default.existsSync(destPath)) {
                        fs_1.default.renameSync(srcPath, destPath);
                    }
                });
                fs_1.default.rmdirSync(itemPath);
                return path_1.default.join(dirPath, 'manifest.json');
            }
        }
    }
    return null;
};
// Function to load extensions
async function loadExtensions(browserWindow) {
    const extensionsDir = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'extensions')
        : path_1.default.join(__dirname, '..', 'extensions');
    console.log('Loading extensions from:', extensionsDir);
    console.log('Is packaged:', electron_1.app.isPackaged);
    // Create extensions directory if it doesn't exist
    if (!fs_1.default.existsSync(extensionsDir)) {
        fs_1.default.mkdirSync(extensionsDir, { recursive: true });
        console.log('Created extensions directory:', extensionsDir);
    }
    // Check if extensions are unzipped
    const checkAndLoadExtension = async (extInfo) => {
        const extPath = path_1.default.join(extensionsDir, extInfo.id);
        console.log(`Processing extension ${extInfo.id}...`);
        console.log('Extension path:', extPath);
        try {
            // Try to extract if needed
            const isExtracted = await extractZipIfNeeded(extensionsDir, extInfo);
            if (!isExtracted) {
                console.error(`Extension ${extInfo.id} is not available and couldn't be extracted`);
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
                const extension = await electron_1.session.defaultSession.loadExtension(extPath, {
                    allowFileAccess: true,
                });
                console.log(`Successfully loaded extension: ${extension.name}`);
                return true;
            }
            catch (loadError) {
                console.error(`Failed to load extension ${extInfo.id}:`, loadError);
                return false;
            }
        }
        catch (e) {
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
        console.log(`Successfully loaded ${loadedCount} out of ${results.length} extensions`);
        // List all loaded extensions
        const loadedExtensions = electron_1.session.defaultSession.getAllExtensions();
        console.log('Currently loaded extensions:', loadedExtensions);
        return loadedCount > 0;
    }
    catch (error) {
        console.error('Error during extension loading:', error);
        return false;
    }
}
// Add this function after loadExtensions
async function verifyLoadedExtensions(browserWindow) {
    return new Promise((resolve) => {
        browserWindow.webContents
            .executeJavaScript(`
      new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.management && chrome.management.getAll) {
          chrome.management.getAll((extensions) => {
            resolve(extensions);
          });
        } else {
          resolve([]);
        }
      })
    `)
            .then((extensions) => {
            if (extensions.length > 0) {
                console.log('Verified loaded extensions:', extensions.map((ext) => ext.name).join(', '));
                browserWindow.webContents.send('extensions-loaded', extensions);
            }
            else {
                console.log('No extensions were verified as loaded');
            }
            resolve(extensions);
        })
            .catch((error) => {
            console.error('Failed to verify extensions:', error);
            resolve([]);
        });
    });
}
function setupExtensionIPC() {
    electron_1.ipcMain.handle('get-extensions', async () => {
        try {
            const extensions = electron_1.session.defaultSession.getAllExtensions();
            console.log('Found extensions:', extensions);
            // Create a serializable version of the extensions
            const serializableExtensions = extensions.map((ext) => ({
                id: ext.id || '',
                name: ext.name || '',
                version: ext.manifest?.version || '',
                description: ext.manifest?.description || '',
                enabled: true,
                hostPermissions: ext.manifest?.host_permissions || [],
            }));
            console.log('Serialized extensions:', serializableExtensions);
            return serializableExtensions;
        }
        catch (error) {
            console.error('Error getting extensions:', error);
            return [];
        }
    });
}
function createExtensionStatusWindow() {
    const statusWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            webSecurity: false,
            partition: 'persist:main',
            additionalArguments: [
                '--enable-features=ExtensionsToolbarMenu,ChromeExtensionAPI',
                '--enable-api=runtime',
            ],
        },
    });
    // Enable required permissions for the window's session
    statusWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    });
    // Enable Chrome extension APIs
    statusWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        return true;
    });
    // Wait for window to be ready and inject required permissions
    statusWindow.webContents.on('did-finish-load', () => {
        statusWindow.webContents.executeJavaScript(`
      // Ensure chrome namespace exists
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      // Initialize runtime API if not available
      if (!chrome.runtime) {
        chrome.runtime = {
          id: 'extension-status',
          getManifest: () => ({}),
          getURL: (path) => path,
          connect: () => ({
            onMessage: { addListener: () => {} },
            postMessage: () => {},
            disconnect: () => {}
          }),
          sendMessage: () => {},
          onMessage: {
            addListener: () => {},
            removeListener: () => {},
            hasListener: () => false
          }
        };
      }

      // Initialize management API if not available
      if (!chrome.management) {
        chrome.management = {
          getAll: async function(callback) {
            try {
              const { ipcRenderer } = require('electron');
              const extensions = await ipcRenderer.invoke('get-extensions');
              callback(extensions);
            } catch (error) {
              console.error('Failed to get extensions:', error);
              callback([]);
            }
          }
        };
      }
    `);
    });
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Extension Status</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #1e1e1e;
            color: #fff;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .header { margin-bottom: 20px; }
          .extension-card {
            background: #2d2d2d;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #0078d4;
          }
          .extension-card.enabled { border-left-color: #4CAF50; }
          .extension-card.disabled { border-left-color: #f44336; }
          button {
            background: #0078d4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
          button:hover { background: #106ebe; }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
          }
          .status-badge.enabled { background: #4CAF50; }
          .status-badge.disabled { background: #f44336; }
          pre {
            background: #000;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Extension Status</h1>
            <button onclick="checkExtensions()">Refresh Status</button>
            <button onclick="checkChromeAPIs()">Check Chrome APIs</button>
            <button onclick="checkDirectExtensions()">Check Extensions Directly</button>
          </div>
          <div id="status">Loading...</div>
        </div>

        <script>
          const statusDiv = document.getElementById('status');
          const { ipcRenderer } = require('electron');

          async function checkChromeAPIs() {
            const apis = {
              chrome: typeof chrome !== 'undefined',
              management: typeof chrome !== 'undefined' && !!chrome.management,
              runtime: typeof chrome !== 'undefined' && !!chrome.runtime,
              getAll: typeof chrome !== 'undefined' && !!chrome.management?.getAll
            };

            statusDiv.innerHTML = '<h2>Chrome APIs Status</h2>' +
              '<pre>' + JSON.stringify(apis, null, 2) + '</pre>';
          }

          async function checkDirectExtensions() {
            try {
              const extensions = await ipcRenderer.invoke('get-extensions');
              console.log('Received extensions:', extensions);
              
              if (!extensions || extensions.length === 0) {
                statusDiv.innerHTML = '<div class="extension-card disabled">No extensions found via direct check</div>';
                return;
              }

              const html = extensions.map(ext => \`
                <div class="extension-card \${ext.enabled ? 'enabled' : 'disabled'}">
                  <h3>
                    \${ext.name} v\${ext.version}
                    <span class="status-badge \${ext.enabled ? 'enabled' : 'disabled'}">
                      \${ext.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </h3>
                  <p><strong>ID:</strong> \${ext.id}</p>
                  <p><strong>Description:</strong> \${ext.description || 'No description'}</p>
                  \${ext.hostPermissions?.length ? \`
                    <p><strong>Host Permissions:</strong> \${ext.hostPermissions.join(', ')}</p>
                  \` : ''}
                </div>
              \`).join('');

              statusDiv.innerHTML = html;
            } catch (error) {
              console.error('Error checking extensions directly:', error);
              statusDiv.innerHTML = \`
                <div class="extension-card disabled">
                  <h3>Error Checking Extensions</h3>
                  <pre>\${error.message}</pre>
                </div>
              \`;
            }
          }

          // Initial check using direct method
          checkDirectExtensions();
        </script>
      </body>
    </html>
  `;
    statusWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    return statusWindow;
}
exports.appUrl = 'http://localhost:9000';
const mainURL = electron_1.app.isPackaged
    ? `file://${path_1.default.join(__dirname, 'index.html')}`
    : 'http://localhost:9300';
exports.containersDefault = [
    'crm-1',
    'frontend-1',
    'redis-serv-1',
    'backend-1',
];
exports.isDevMode = !electron_1.app.isPackaged || process.env.NODE_ENV === 'development';
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
if (!electron_1.app.isDefaultProtocolClient(protocolName)) {
    const success = electron_1.app.setAsDefaultProtocolClient(protocolName);
    if (success) {
        (0, logger_1.logger)(`${protocolName} protocol successfully registered.`);
    }
    else {
        (0, logger_1.logger)(`Failed to register ${protocolName} protocol.`);
    }
}
if (process.platform === 'win32') {
    const protocolRegistryFlagPath = `${electron_1.app.getPath('userData')}/protocol_registered.flag`;
    if (!fs_1.default.existsSync(protocolRegistryFlagPath)) {
        const tempRegistryFile = `${require('os').tmpdir()}\\protocol_registry.reg`;
        fs_1.default.writeFileSync(tempRegistryFile, registryScript, 'utf-8');
        try {
            (0, child_process_1.execSync)(`reg import "${tempRegistryFile}"`, { stdio: 'inherit' });
            (0, logger_1.logger)('Protocol handler registered successfully.');
            fs_1.default.writeFileSync(protocolRegistryFlagPath, 'true', 'utf-8'); // Mark as registered
        }
        catch (error) {
            console.error('Failed to register protocol handler:', error.message);
        }
    }
}
// if (!app.requestSingleInstanceLock()) {
//   app.quit(); // Exit the second instance immediately
// }
const getPreloadPath = () => {
    const preloadFileName = 'electron-preload.js';
    return electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'app.asar', preloadFileName)
        : path_1.default.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD);
};
const openWindow = async (windowTitle, url = null) => {
    const newWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
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
        if ((input.control || input.meta) &&
            input.shift &&
            input.key.toLowerCase() === 'e') {
            newWindow.webContents
                .executeJavaScript(`
        chrome.management.getAll((extensions) => {
          console.log('Loaded Extensions:', extensions);
        });
      `)
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
exports.openWindow = openWindow;
async function createMainWindow() {
    exports.mainWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
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
    // Enable Chrome APIs for the main window
    exports.mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    });
    exports.mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        return true;
    });
    // Add keyboard shortcuts for extension management with proper type annotations
    exports.mainWindow.webContents.on('before-input-event', (event, input) => {
        // Ctrl+Shift+E (or Cmd+Shift+E on macOS) to open extension status
        if ((input.control || input.meta) &&
            input.shift &&
            input.key.toLowerCase() === 'e') {
            createExtensionStatusWindow();
        }
    });
    // Load extensions before loading the URL
    const extensionsLoaded = await loadExtensions(exports.mainWindow);
    // Initialize extension APIs
    exports.mainWindow.webContents.on('did-finish-load', () => {
        exports.mainWindow.webContents.executeJavaScript(`
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      // Initialize runtime API
      if (!chrome.runtime) {
        chrome.runtime = {
          id: 'main-window',
          getManifest: () => ({}),
          getURL: (path) => path,
          connect: () => ({
            onMessage: { addListener: () => {} },
            postMessage: () => {},
            disconnect: () => {}
          }),
          sendMessage: () => {},
          onMessage: {
            addListener: () => {},
            removeListener: () => {},
            hasListener: () => false
          }
        };
      }

      // Initialize management API
      if (!chrome.management) {
        chrome.management = {
          getAll: function(callback) {
            window.postMessage({ type: 'GET_EXTENSIONS' }, '*');
            window.addEventListener('message', function(event) {
              if (event.data.type === 'EXTENSIONS_LIST') {
                callback(event.data.extensions);
              }
            });
          }
        };
      }
    `);
    });
    exports.mainWindow.webContents.session.clearCache().then(() => {
        (0, logger_1.logger)('Cache cleared successfully.');
    });
    const mainURL = electron_1.app.isPackaged
        ? `file://${path_1.default.join(__dirname, 'index.html')}`
        : 'http://localhost:9300';
    await exports.mainWindow.loadURL(mainURL);
    // Verify extensions after page load
    exports.mainWindow.webContents.on('did-finish-load', async () => {
        // Wait a bit to ensure extensions are fully initialized
        setTimeout(async () => {
            await verifyLoadedExtensions(exports.mainWindow);
        }, 2000);
    });
    try {
        (0, websocket_1.setWindowCallback)(exports.openWindow);
    }
    catch (error) {
        console.error('Failed to set window callback:', error);
    }
}
electron_1.app.whenReady().then(() => {
    if (process.platform === 'win32') {
        // Protocol setup
        const execPath = process.execPath;
        const escapedExecPath = execPath
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        const command = `"${escapedExecPath}" "%1"`;
    }
    if (electron_1.app.isPackaged) {
        // Define the Supabase redirect URI
        const redirectUri = 'http://localhost/auth/callback';
        const filter = { urls: [`${redirectUri}*`] };
    }
    // Register chrome-extension protocol without interfering with Supabase
    electron_1.protocol.handle('chrome-extension', (request) => {
        const url = request.url.substring('chrome-extension://'.length);
        const extensionParts = url.split('/');
        const extensionId = extensionParts[0];
        const extensionPath = electron_1.app.isPackaged
            ? path_1.default.join(process.resourcesPath, 'extensions', extensionId)
            : path_1.default.join(__dirname, '..', 'extensions', extensionId);
        const filePath = path_1.default.join(extensionPath, ...extensionParts.slice(1));
        return electron_1.net.fetch(`file://${filePath}`);
    });
    // Setup extension IPC handlers
    setupExtensionIPC();
    createMainWindow();
    (0, ipcHandlers_1.initializeIpcHandlers)(exports.mainWindow);
    (0, autoUpdate_1.initializeAutoUpdater)(exports.mainWindow);
});
if (!electron_1.app.requestSingleInstanceLock()) {
    electron_1.app.quit(); // Quit the second instance immediately
}
else {
    electron_1.app.on('second-instance', (event, commandLine) => {
        const url = commandLine.find((arg) => arg.startsWith(`${protocolName}://`));
        if (url && exports.mainWindow) {
            exports.mainWindow.webContents.send('navigate-to-url', url);
            if (exports.mainWindow.isMinimized()) {
                exports.mainWindow.restore();
            }
            exports.mainWindow.focus();
        }
    });
}
// macOS deep link handler
electron_1.app.on('open-url', (event, url) => {
    // event.preventDefault();
    // log('Received deep link URL:', url);
    (0, logger_1.logger)(`🚀 open-url event triggered: ${url}`);
    try {
        exports.mainWindow.webContents.send('navigate-to-url', url);
    }
    catch (error) {
        (0, logger_1.logger)(error);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (!exports.mainWindow) {
        createMainWindow();
    }
});
