"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWindow = exports.isDevMode = exports.containersDefault = exports.appUrl = exports.mainWindow = void 0;
const electron_1 = require("electron");
const electron_log_1 = require("electron-log");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const autoUpdate_1 = require("./installScripts/autoUpdate");
const ipcHandlers_1 = require("./installScripts/ipcHandlers");
const websocket_1 = require("./installScripts/websocket");
exports.mainWindow = null;
exports.appUrl = 'http://localhost:9000';
exports.containersDefault = [
    'crm-1',
    'frontend-1',
    'redis-serv-1',
    'backend-1',
];
exports.isDevMode = !electron_1.app.isPackaged || process.env.NODE_ENV === 'development';
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
        console.log('Cache cleared successfully.');
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
        const success = electron_1.app.setAsDefaultProtocolClient(protocolName);
        if (success) {
            console.log(`${protocolName} protocol successfully registered.`);
        }
        else {
            console.log(`Failed to register ${protocolName} protocol.`);
        }
        // Log and execute registry script
        console.log('Generated Registry Script:', registryScript);
        const tempRegistryFile = `${require('os').tmpdir()}\\protocol_registry.reg`;
        fs_1.default.writeFileSync(tempRegistryFile, registryScript, 'utf-8');
        try {
            (0, child_process_1.execSync)(`reg import "${tempRegistryFile}"`, { stdio: 'inherit' });
            console.log('Protocol handler registered successfully.');
        }
        catch (error) {
            console.error('Failed to register protocol handler:', error.message);
        }
    }
    createMainWindow();
    (0, ipcHandlers_1.initializeIpcHandlers)();
    (0, autoUpdate_1.initializeAutoUpdater)(exports.mainWindow);
});
// Single-instance lock to prevent multiple app instances
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', (event, argv) => {
        // Handle protocol URL when second instance is invoked
        if (process.platform === 'win32' && argv.length > 1) {
            const url = argv.find((arg) => arg.startsWith('infinityinstaller://'));
            if (url && exports.mainWindow) {
                exports.mainWindow.webContents.send('navigate-to-url', url);
            }
        }
        // Focus the existing window
        if (exports.mainWindow) {
            if (exports.mainWindow.isMinimized()) {
                exports.mainWindow.restore();
            }
            exports.mainWindow.focus();
        }
    });
    electron_1.app.on('ready', () => {
        createMainWindow();
    });
}
// Handle macOS deep linking
electron_1.app.on('open-url', (event, url) => {
    event.preventDefault();
    (0, electron_log_1.log)(`🚀 open-url event triggered: ${url}`);
    if (exports.mainWindow) {
        exports.mainWindow.webContents.send('navigate-to-url', url);
    }
});
// Handle all windows closed
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Handle app activation
electron_1.app.on('activate', () => {
    if (!exports.mainWindow) {
        createMainWindow();
    }
});
