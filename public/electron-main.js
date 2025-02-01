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
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
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
electron_1.app.setAsDefaultProtocolClient('infinityinstaller');
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
// Add this function at the top level
function findAvailablePort(startPort, endPort) {
    return new Promise((resolve, reject) => {
        function tryPort(port) {
            if (port > endPort) {
                reject(new Error('No available ports found'));
                return;
            }
            const testServer = http_1.default.createServer();
            testServer.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    tryPort(port + 1);
                }
                else {
                    reject(err);
                }
            });
            testServer.once('listening', () => {
                testServer.close(() => resolve(port));
            });
            testServer.listen(port, 'localhost');
        }
        tryPort(startPort);
    });
}
// Modify the createAuthCallbackServer function
function createAuthCallbackServer(mainWindow) {
    let server = null;
    async function startServer() {
        try {
            // Find an available port in a range
            const basePort = electron_1.app.isPackaged ? 9301 : 9300;
            const port = await findAvailablePort(basePort, basePort + 10);
            server = http_1.default.createServer((req, res) => {
                const parsedUrl = url_1.default.parse(req.url || '', true);
                console.log('Incoming request URL:', req.url);
                console.log('Parsed URL:', parsedUrl);
                // Handle auth callback
                if (parsedUrl.pathname === '/auth/callback') {
                    // Get the full URL including hash fragment
                    const fullUrl = req.url || '';
                    console.log('Auth callback received. Full URL:', fullUrl);
                    // Send a simple HTML page that will pass the token back to the main window
                    const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                  }
                  .message {
                    text-align: center;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  }
                </style>
              </head>
              <body>
                <div class="message">
                  <h3>Authentication successful!</h3>
                  <p>Redirecting back to app...</p>
                </div>
                <script>
                  function init() {
                    console.log('Auth callback init');
                    // Function to parse URL parameters including hash
                    function parseUrlParams() {
                      const params = new URLSearchParams(window.location.search);
                      const hash = window.location.hash;
                      console.log('URL Search:', window.location.search);
                      console.log('URL Hash:', hash);
                      
                      // Try to get token from hash first (remove the leading #)
                      if (hash) {
                        const hashParams = new URLSearchParams(hash.substring(1));
                        const accessToken = hashParams.get('access_token');
                        const refreshToken = hashParams.get('refresh_token');
                        if (accessToken) {
                          return hash.substring(1); // Return the entire hash content without the #
                        }
                      }
                      
                      // Fallback to search params
                      const accessToken = params.get('access_token');
                      const refreshToken = params.get('refresh_token');
                      if (accessToken) {
                        return \`access_token=\${accessToken}\${refreshToken ? '&refresh_token=' + refreshToken : ''}\`;
                      }
                      
                      return null;
                    }
                    
                    // Get the auth data
                    const authData = parseUrlParams();
                    console.log('Auth data found:', authData ? 'yes' : 'no');
                    
                    if (authData) {
                      // Construct the redirect URL based on environment
                      const baseUrl = ${electron_1.app.isPackaged
                        ? `'file://' + path.join(__dirname, 'index.html')`
                        : "'http://localhost:9300'"};
                      // Pass the entire auth data as hash to preserve all parameters
                      const redirectUrl = baseUrl + '/#/auth?' + authData;
                      console.log('Redirecting to:', redirectUrl);
                      window.location.href = redirectUrl;
                    }
                  }

                  // Run init when the page loads
                  if (document.readyState === 'complete') {
                    init();
                  } else {
                    window.addEventListener('load', init);
                  }
                </script>
              </body>
            </html>
          `;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                    // Focus the main window
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        if (mainWindow.isMinimized()) {
                            mainWindow.restore();
                        }
                        mainWindow.focus();
                    }
                }
                else {
                    res.writeHead(404);
                    res.end();
                }
            });
            server.listen(port, 'localhost', () => {
                console.log(`Auth callback server listening on port ${port}`);
            });
            // Handle server errors
            server.on('error', (err) => {
                console.error('Auth server error:', err);
                //@ts-ignore
                if (err.code === 'EADDRINUSE') {
                    console.log('Port in use, trying another port...');
                    server?.close();
                    startServer(); // Try again with next port
                }
            });
        }
        catch (error) {
            console.error('Failed to start auth server:', error);
        }
    }
    // Start the server
    startServer();
    // Return an object with cleanup method
    return {
        close: () => {
            if (server) {
                server.close();
                server = null;
            }
        },
    };
}
// Update createMainWindow to remove auth window references
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
    // Add temporary logging for navigation events
    exports.mainWindow.webContents.on('did-start-navigation', (event, url) => {
        console.log('Main window - Navigation started:', {
            url,
            currentURL: exports.mainWindow.webContents.getURL(),
        });
    });
    exports.mainWindow.webContents.on('did-navigate', (event, url) => {
        console.log('Main window - Navigation completed:', {
            url,
            currentURL: exports.mainWindow.webContents.getURL(),
        });
    });
    // Load the app
    const mainURL = electron_1.app.isPackaged
        ? `file://${path_1.default.join(__dirname, 'index.html')}`
        : 'http://localhost:9300';
    console.log('Loading main URL:', mainURL);
    await exports.mainWindow.loadURL(mainURL);
    // Show dev tools in development
    if (!electron_1.app.isPackaged) {
        exports.mainWindow.webContents.openDevTools();
    }
    try {
        (0, websocket_1.setWindowCallback)(exports.openWindow);
    }
    catch (error) {
        console.error('Failed to set window callback:', error);
    }
}
// Keep the protocol handler as is since it's working
electron_1.app.whenReady().then(() => {
    electron_1.protocol.handle('infinityinstaller', (request) => {
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
                const appUrl = electron_1.app.isPackaged
                    ? `file://${path_1.default.join(__dirname, 'index.html')}#/auth${authData}`
                    : `http://localhost:9300/#/auth${authData}`;
                console.log('Redirecting to app URL:', appUrl);
                if (exports.mainWindow) {
                    exports.mainWindow.loadURL(appUrl);
                    if (exports.mainWindow.isMinimized()) {
                        exports.mainWindow.restore();
                    }
                    exports.mainWindow.focus();
                }
            }
        }
        catch (error) {
            console.error('Error handling protocol URL:', error);
        }
        return new Response();
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
