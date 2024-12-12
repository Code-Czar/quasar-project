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
const openWindow = (windowTitle, url = null) => {
    const newWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
        frame: true, // Makes the window borderless
        resizable: true, // Allow the window to be resized
        webPreferences: {
            contextIsolation: true,
            sandbox: false,
            preload: path_1.default.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
            devTools: true, // Ensure DevTools are enabled
            // devTools: true, // Ensure DevTools are enabled
        },
    });
    console.log('🚀 ~ openWindow ~ url:', url);
    console.log('🚀 ~ openWindow ~ windowTitle:', windowTitle);
    newWindow.loadURL(url || 'http://tiktok.com');
    newWindow.webContents.on('did-finish-load', () => {
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
function createMainWindow() {
    exports.mainWindow = new electron_1.BrowserWindow({
        width: electron_1.screen.getPrimaryDisplay().workAreaSize.width,
        height: electron_1.screen.getPrimaryDisplay().workAreaSize.height,
        frame: false, // Makes the window borderless
        webPreferences: {
            contextIsolation: true,
            sandbox: false,
            preload: path_1.default.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
            devTools: true, // Ensure DevTools are enabled
            webSecurity: false, // Disable web security to allow file:// URLs
        },
    });
    exports.mainWindow.webContents.session.clearCache().then(() => {
        (0, logger_1.logger)('Cache cleared successfully.');
    });
    const mainURL = electron_1.app.isPackaged
        ? `file://${path_1.default.join(__dirname, 'index.html')}`
        : 'http://localhost:9300';
    exports.mainWindow.loadURL(mainURL);
    try {
        (0, websocket_1.initWebSocket)(exports.openWindow);
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
    createMainWindow();
    // log(`Location origin : ${mainWindow.origin.location}`);
    (0, ipcHandlers_1.initializeIpcHandlers)(exports.mainWindow);
    (0, autoUpdate_1.initializeAutoUpdater)(exports.mainWindow);
    // app.commandLine.appendSwitch('remote-debugging-port', '9222');
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
