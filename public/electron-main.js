"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWindow = exports.isDevMode = exports.containersDefault = exports.appUrl = exports.mainWindow = void 0;
const electron_1 = require("electron");
const electron_log_1 = require("electron-log");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// import fixPath from 'fix-path';
// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
const autoUpdate_1 = require("./installScripts/autoUpdate");
const ipcHandlers_1 = require("./installScripts/ipcHandlers");
const websocket_1 = require("./installScripts/websocket");
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
const command = `"${escapedExecPath}" "%1"`;
const escapedExecPath = execPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
        (0, electron_log_1.log)(`${protocolName} protocol successfully registered.`);
    }
    else {
        (0, electron_log_1.log)(`Failed to register ${protocolName} protocol.`);
    }
}
const protocolRegistryFlagPath = `${electron_1.app.getPath('userData')}/protocol_registered.flag`;
if (!fs_1.default.existsSync(protocolRegistryFlagPath)) {
    const tempRegistryFile = `${require('os').tmpdir()}\\protocol_registry.reg`;
    fs_1.default.writeFileSync(tempRegistryFile, registryScript, 'utf-8');
    try {
        (0, child_process_1.execSync)(`reg import "${tempRegistryFile}"`, { stdio: 'inherit' });
        (0, electron_log_1.log)('Protocol handler registered successfully.');
        fs_1.default.writeFileSync(protocolRegistryFlagPath, 'true', 'utf-8'); // Mark as registered
    }
    catch (error) {
        console.error('Failed to register protocol handler:', error.message);
    }
}
// if (!app.requestSingleInstanceLock()) {
//   app.quit(); // Exit the second instance immediately
// }
const openWindow = (windowTitle, url = null) => {
    const newWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
        webPreferences: {
            contextIsolation: true,
            sandbox: false,
            preload: path_1.default.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
        },
    });
    newWindow.setTitle(windowTitle);
    newWindow.loadURL(url || 'http://tiktok.com');
};
exports.openWindow = openWindow;
function createMainWindow() {
    exports.mainWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
        webPreferences: {
            contextIsolation: true,
            sandbox: false,
            preload: path_1.default.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
        },
    });
    exports.mainWindow.webContents.session.clearCache().then(() => {
        (0, electron_log_1.log)('Cache cleared successfully.');
    });
    const mainURL = electron_1.app.isPackaged
        ? `file://${path_1.default.join(__dirname, 'index.html')}`
        : 'http://localhost:9300';
    exports.mainWindow.loadURL(mainURL);
    (0, websocket_1.initWebSocket)(exports.openWindow);
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
        // Intercept redirect URIs
        session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
            const url = details.url;
            console.log('Intercepted URL:', url);
            // Parse tokens from URL fragment (hash)
            const urlFragment = new URL(url).hash.substring(1); // Remove the `#` symbol
            const fragmentParams = new URLSearchParams(urlFragment);
            const accessToken = fragmentParams.get('access_token');
            const refreshToken = fragmentParams.get('refresh_token');
            // Log tokens
            console.log('Access Token:', accessToken);
            console.log('Refresh Token:', refreshToken);
            if (accessToken) {
                // Redirect to the auth page with tokens
                exports.mainWindow.loadURL(`${mainURL}#/auth?access_token=${accessToken}&refresh_token=${refreshToken}`);
            }
            // Cancel the original request
            callback({ cancel: true });
        });
    }
    createMainWindow();
    (0, electron_log_1.log)(`Location origin : ${exports.mainWindow.origin.location}`);
    (0, ipcHandlers_1.initializeIpcHandlers)();
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
    (0, electron_log_1.log)(`🚀 open-url event triggered: ${url}`);
    try {
        exports.mainWindow.webContents.send('navigate-to-url', url);
    }
    catch (error) {
        (0, electron_log_1.log)(error);
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
