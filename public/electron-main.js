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
async function loadExtensions(browserWindow) {
    const extensionsDir = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'extensions')
        : path_1.default.join(__dirname, '..', 'extensions');
    console.log('Loading extensions from:', extensionsDir);
    // Add keyboard shortcut to check extensions
    browserWindow.webContents.on('before-input-event', (event, input) => {
        if ((input.control || input.meta) &&
            input.shift &&
            input.key.toLowerCase() === 'e') {
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
              ${extensions.length
                ? extensions
                    .map((ext) => `
                <div class="extension">
                  <h3>${ext.name}</h3>
                  <p>Version: ${ext.version}</p>
                  <p>ID: ${ext.id}</p>
                </div>
              `)
                    .join('')
                : '<p>No extensions loaded</p>'}
              <hr>
              <h3>Extensions Directory</h3>
              <p>${extensionsDir}</p>
            </body>
          </html>
        `;
            // Create a new window to display extensions info
            const extensionsWindow = new electron_1.BrowserWindow({
                width: 600,
                height: 400,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                },
            });
            extensionsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
        }
    });
    // Check if extensions are unzipped
    const checkAndLoadExtension = async (extInfo) => {
        const extPath = path_1.default.join(extensionsDir, extInfo.id);
        if (!fs_1.default.existsSync(extPath)) {
            console.error(`Extension directory not found: ${extPath}`);
            return;
        }
        try {
            const extension = await browserWindow.webContents.session.loadExtension(extPath, {
                allowFileAccess: true,
            });
            console.log(`${extInfo.id} loaded successfully:`, {
                name: extension.name,
                version: extension.version,
                id: extension.id,
            });
        }
        catch (e) {
            console.error(`Failed to load ${extInfo.id}:`, e);
        }
    };
    // Load both extensions
    await checkAndLoadExtension(EXTENSIONS.UBLOCK);
    await checkAndLoadExtension(EXTENSIONS.GHOSTERY);
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
electron_1.app.commandLine.appendSwitch('remote-debugging-port', '9222');
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
            // Enable Chrome extensions
            nodeIntegration: true,
            webviewTag: true,
        },
    });
    // Add keyboard shortcut to directly check extensions
    exports.mainWindow.webContents.on('before-input-event', (event, input) => {
        // Ctrl+Shift+E or Cmd+Shift+E to check extensions
        if ((input.control || input.meta) &&
            input.shift &&
            input.key.toLowerCase() === 'e') {
            exports.mainWindow.webContents
                .executeJavaScript(`
          chrome.management.getAll((extensions) => {
            console.log('Loaded Extensions:', extensions);
          });
        `)
                .catch((err) => console.error('Failed to check extensions:', err));
        }
    });
    // Load extensions before loading the URL
    await loadExtensions(exports.mainWindow);
    exports.mainWindow.webContents.session.clearCache().then(() => {
        (0, logger_1.logger)('Cache cleared successfully.');
    });
    const mainURL = electron_1.app.isPackaged
        ? `file://${path_1.default.join(__dirname, 'index.html')}`
        : 'http://localhost:9300';
    exports.mainWindow.loadURL(mainURL);
    try {
        (0, websocket_1.setWindowCallback)(exports.openWindow);
    }
    catch (error) { }
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
