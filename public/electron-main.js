"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWindow = exports.isDevMode = exports.containersDefault = exports.appUrl = exports.mainWindow = void 0;
const electron_1 = require("electron");
const electron_log_1 = require("electron-log");
const path_1 = __importDefault(require("path"));
// import fixPath from 'fix-path';
// Dynamically resolve paths using __dirname (or app.getAppPath() if needed)
const autoUpdate_1 = require("./installScripts/autoUpdate");
const ipcHandlers_1 = require("./installScripts/ipcHandlers");
require("./installScripts/websocket");
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
    // initWebSocket();
}
electron_1.app.whenReady().then(() => {
    // Register protocol only in production mode
    if (!exports.isDevMode) {
        // protocol.registerSchemesAsPrivileged([
        //   {
        //     scheme: 'infinityinstaller',
        //     privileges: {
        //       secure: true,
        //       standard: true,
        //     },
        //   },
        // ]);
        // Set as default protocol client only in production
        //   app.setAsDefaultProtocolClient('infinityinstaller');
        // }
        // // Windows/Linux protocol handler
        // if (!app.isDefaultProtocolClient('infinityinstaller')) {
        //   app.setAsDefaultProtocolClient('infinityinstaller');
    }
    createMainWindow();
    (0, ipcHandlers_1.initializeIpcHandlers)();
    (0, autoUpdate_1.initializeAutoUpdater)(exports.mainWindow);
});
// app.on('all', (event, ...args: any) => {
//   log(`Global Event Listener: ${event} ${args}`);
// });
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
