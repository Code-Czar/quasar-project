"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAutoUpdater = exports.downloadUpdate = exports.checkForUpdates = exports.getCurrentVersion = void 0;
const electron_1 = require("electron");
const utils_1 = require("./utils");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// import log from 'electron-log';
const js_yaml_1 = __importDefault(require("js-yaml"));
const UPDATE_CHECK_URL = 'https://beniben.hopto.org/user/check-for-updates'; // Replace with your backend URL
const DOWNLOAD_URL = 'https://beniben.hopto.org/user/download-updates'; // Replace with your backend URL
const PRODUCT_NAME = 'InfinityInstaller'; // Replace with your backend URL
const DOWNLOAD_DIR = path_1.default.join(electron_1.app.getPath('userData'), 'updates');
const getCurrentVersion = async () => {
    try {
        const appPath = electron_1.app.getAppPath();
        const versionPath = path_1.default.join(path_1.default.dirname(appPath), 'version.yml');
        if (fs_1.default.existsSync(versionPath)) {
            const versionFile = await fs_1.default.promises.readFile(versionPath, 'utf8');
            const versionData = js_yaml_1.default.load(versionFile);
            // @ts-ignore
            return versionData.version || null;
        }
        return null;
    }
    catch (error) {
        (0, utils_1.logger)(`Error reading version file: ${error.message}`);
        return null;
    }
};
exports.getCurrentVersion = getCurrentVersion;
const checkForUpdates = async (product = PRODUCT_NAME, isSystem = true, destination = DOWNLOAD_DIR, requestPlatform = 'mac', requestArch = 'arm64') => {
    try {
        const currentVersion = await (0, exports.getCurrentVersion)();
        (0, utils_1.logger)(`Checking for updates (current version: ${currentVersion})...`);
        // Call the backend to check for updates
        const response = await axios_1.default.get(UPDATE_CHECK_URL, {
            params: { version: currentVersion, product },
            // params: { product: PRODUCT_NAME },
        });
        console.log('🚀 ~ checkForUpdates ~ response:', response);
        const { update_available, server_version } = response.data;
        if (update_available) {
            (0, utils_1.logger)(`Update available: ${server_version}`);
            const userResponse = electron_1.dialog.showMessageBoxSync({
                type: 'info',
                buttons: ['Download', 'Later'],
                title: 'Update Available',
                message: `Version ${server_version} is available. Would you like to download it now?`,
            });
            if (userResponse === 0) {
                // User chose to download the update
                console.log('🚀 ~ requestArch:', requestArch);
                console.log('🚀 ~ requestPlatform:', requestPlatform);
                console.log('🚀 ~ destination:', destination);
                console.log('🚀 ~ product:', product);
                console.log('🚀 ~ DOWNLOAD_URL:', DOWNLOAD_URL);
                const downloadFolder = await (0, exports.downloadUpdate)(DOWNLOAD_URL, isSystem, product, destination, requestPlatform, requestArch);
                if (isSystem) {
                    // handleUpdateReady(downloadFolder);
                }
            }
        }
        else {
            electron_1.dialog.showMessageBoxSync({
                type: 'info',
                title: 'No Updates',
                message: 'You are already using the latest version.',
            });
        }
    }
    catch (error) {
        (0, utils_1.logger)(`Error checking for updates: ${error.message}`);
        electron_1.dialog.showMessageBoxSync({
            type: 'error',
            title: 'Update Check Failed',
            message: 'Could not check for updates. Please try again later.',
        });
    }
};
exports.checkForUpdates = checkForUpdates;
const downloadUpdate = async (url, isSystem = true, productName = PRODUCT_NAME, destination = DOWNLOAD_DIR, requestPlatform = 'mac', requestArch = 'arm64') => {
    try {
        console.log('🚀 ~ url:', url, productName, destination, requestPlatform, requestArch);
        (0, utils_1.logger)(`Downloading update from: ${url}`);
        const urlConstructed = new URL(url);
        // @ts-ignore
        urlConstructed.search = new URLSearchParams({
            product: productName,
            platform: requestPlatform,
            arch: requestArch,
        });
        (0, utils_1.logger)(urlConstructed.search);
        const response = await fetch(urlConstructed, {
            method: 'GET',
            headers: { 'Content-Type': 'application/zip' },
        });
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        destination = path_1.default.join(destination, productName, 'updates');
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        const contentDisposition = response.headers.get('content-disposition');
        const fileName = contentDisposition
            ? // @ts-ignore
                contentDisposition?.match(/filename="?([^"]+)"?/)[1]
            : 'update.zip';
        const filePath = path_1.default.join(destination, fileName);
        (0, utils_1.logger)(`Saving update to: ${filePath}`);
        const buffer = await response.arrayBuffer();
        await fs_1.default.promises.writeFile(filePath, Buffer.from(buffer));
        (0, utils_1.logger)(`Update downloaded to: ${filePath}`);
        if (fileName.endsWith('.zip') && isSystem) {
            const extractDir = path_1.default.join(destination, 'extracted');
            const appPath = electron_1.app.getAppPath();
            const resourcesPath = path_1.default.dirname(appPath);
            const asarPath = path_1.default.join(resourcesPath, 'app.asar');
            const asarPathBackup = path_1.default.join(resourcesPath, 'app.asar_backup');
            const asarPathZip = path_1.default.join(extractDir, 'app.asar.zip');
            const updateAsar = path_1.default.join(extractDir, 'app.asar');
            const tempAsarPath = path_1.default.join(resourcesPath, 'app.asar_temp');
            const versionFile = path_1.default.join(extractDir, 'version.yml');
            const targetVersionFile = path_1.default.join(resourcesPath, 'version.yml');
            (0, utils_1.logger)(`Extracting update to: ${extractDir}`);
            process.noAsar = true;
            await (0, utils_1.extractZip)(filePath, extractDir);
            await (0, utils_1.extractZip)(asarPathZip, extractDir);
            (0, utils_1.logger)(`Preparing temporary asar file at: ${tempAsarPath}`);
            await fs_1.default.promises.copyFile(updateAsar, tempAsarPath);
            (0, utils_1.logger)(`Updating version file from ${versionFile} to ${targetVersionFile}`);
            await fs_1.default.promises.copyFile(versionFile, targetVersionFile);
            // Schedule app relaunch and replacement
            (0, utils_1.logger)(`Replacing app.asar with the temporary file: ${tempAsarPath}`);
            await fs_1.default.promises.copyFile(asarPath, asarPathBackup);
            await fs_1.default.promises.copyFile(updateAsar, asarPath);
            // await fs.promises.rename(tempAsarPath, asarPath); // Replace the old asar
            (0, utils_1.logger)(`Successfully replaced app.asar: ${asarPath}`);
            // app.on('will-quit', async () => {
            //   try {
            //     log(`Replacing app.asar with the temporary file: ${tempAsarPath}`);
            //     await fs.promises.rename(tempAsarPath, asarPath); // Replace the old asar
            //     log(`Successfully replaced app.asar: ${asarPath}`);
            //   } catch (error) {
            //     log.error(`Error replacing app.asar: ${error.message}`);
            //   }
            // });
            const userDataPath = electron_1.app.getPath('userData');
            (0, utils_1.logger)(`Clearing Electron cache at: ${userDataPath}`);
            await fs_1.default.promises.rm(tempAsarPath, { recursive: true, force: true });
            await fs_1.default.promises.rm(asarPathBackup, { recursive: true, force: true });
            // await fs.promises.rm(userDataPath, { recursive: true, force: true });
            (0, utils_1.logger)(`Cache cleared.`);
            setTimeout(() => {
                (0, utils_1.logger)('Quitting the application to apply the update...');
                electron_1.app.relaunch();
                // app.quit();
                electron_1.app.exit(0);
            }, 1000);
        }
        else if (fileName.endsWith('.zip')) {
            // const extractDir = path.join(destination, productName, 'updates');
            const extractDir = destination; // path.join(destination, 'extracted');
            (0, utils_1.logger)(`Extracting update to: ${extractDir}`);
            process.noAsar = true;
            await (0, utils_1.extractZip)(filePath, extractDir);
            await fs_1.default.promises.rm(path_1.default.join(destination, fileName), {
                recursive: true,
                force: true,
            });
            // Read all files in the folder
            fs_1.default.readdirSync(destination).forEach(async (file) => {
                const filePath = path_1.default.join(destination, file);
                // Check if the file is a ZIP file
                if (path_1.default.extname(file) === '.zip') {
                    await (0, utils_1.extractZip)(filePath, extractDir);
                    // const zip = new AdmZip(filePath);
                    // // Extract the contents of the zip file to the folder
                    // zip.extractAllTo(path.join(folderPath, path.basename(file, '.zip')), true);  // Extract into a folder named after the ZIP file
                    console.log(`Extracted: ${file}`);
                }
            });
            // const filePath = path.join(destination, fileName);
        }
    }
    catch (error) {
        (0, utils_1.logger)(`Error during update download:${error.message}`);
        throw error;
    }
};
exports.downloadUpdate = downloadUpdate;
const initializeAutoUpdater = (mainWindow) => {
    (0, utils_1.logger)('Custom updater initialized');
    const handleUpdateReady = (downloadFolder) => {
        // const userResponse = dialog.showMessageBoxSync({
        //   type: 'info',
        //   buttons: ['Restart Now', 'Later'],
        //   title: 'Update Ready',
        //   message: `Updates has been downloaded in ${downloadFolder}. Do you want to restart the application to apply the update?`,
        // });
        // console.log('🚀 ~ handleUpdateReady ~ downloadFolder:', downloadFolder);
        // if (userResponse === 0) {
        //   // Quit and restart the app with the new update
        //   // const updatePath = path.join(DOWNLOAD_DIR, `update-v${version}.exe`);
        //   log('Restarting app ');
        //   // app.quit();
        //   // // Launch the update installer
        //   spawn(updatePath, { detached: true, stdio: 'ignore' }).unref();
        // }
    };
    // Check for updates when the app is ready
    electron_1.app.whenReady().then(() => {
        (0, exports.checkForUpdates)();
    });
};
exports.initializeAutoUpdater = initializeAutoUpdater;
