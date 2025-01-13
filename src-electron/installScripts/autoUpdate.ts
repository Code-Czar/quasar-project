import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { app, dialog } from 'electron';
import { spawn, exec, ChildProcess } from 'child_process';
// import { log } from 'electron-log';
import { logger as log } from './logger';
import { delay, extractZip } from './utils';
import https from 'https';
import http from 'http';
import axios from 'axios';

const UPDATE_CHECK_URL = 'https://beniben.hopto.org/user/check-for-updates';
const DOWNLOAD_URL = 'https://beniben.hopto.org/user/download-updates';
const PRODUCT_NAME = 'InfinityInstaller';
const DOWNLOAD_DIR = path.dirname(app.getPath('userData'));
const UPDATE_DIR = `${DOWNLOAD_DIR}/${PRODUCT_NAME}/updates`;
let mainWindow: any | null = null;

// Set global maximum number of concurrent sockets per agent
https.globalAgent.maxSockets = 50;
http.globalAgent.maxSockets = 50;

let childProcesses: Map<string, ChildProcess> = new Map();

// @ts-ignore
const customHttpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 60000,
});

async function downloadApp(url: string, destinationPath: string) {
  const writer = fs.createWriteStream(destinationPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(response)); // Resolve with the response object
    writer.on('error', reject);
  });
}

/**
 * Recursively sets executable permissions for all files in a directory.
 * @param dirPath The path to the directory to process.
 */
const setExecutablePermissionsRecursively = (dirPath: string): void => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    try {
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        setExecutablePermissionsRecursively(entryPath);
      } else if (entry.isFile()) {
        // Check the file type and set executable permissions if necessary
        const fileStats = fs.statSync(entryPath);
        fs.chmodSync(entryPath, '755');
        log(
          `🚀 ~ setExecutablePermissionsRecursively ~ entryPath: ${entryPath}`,
        );

        // Only set +x if the file isn't already executable
        // const isExecutable = (fileStats.mode & 0o111) !== 0; // Check any execute bit
        // if (!isExecutable) {
        //   fs.chmodSync(entryPath, 0o755); // Set execute permission for the owner, group, and others
        //   console.log(`Set executable permissions: ${entryPath}`);
        // }
      }
    } catch (error) {
      console.error(`Error processing file: ${entryPath}`, error);
    }
  }
};

// Utility function to read the current app version
export const getCurrentVersion = async (
  productName: string | null = null,
): Promise<string | null> => {
  try {
    let versionPath;
    if (!productName) {
      versionPath = path.join(path.dirname(app.getAppPath()), 'version.yml');
    } else {
      versionPath = path.join(
        path.dirname(app.getAppPath()),
        productName as string,
        'version.yml',
      );
    }
    console.log('🚀 ~ versionPath:', versionPath);

    if (fs.existsSync(versionPath)) {
      const versionFile = await fs.promises.readFile(versionPath, 'utf8');
      const versionData: any = yaml.load(versionFile);
      console.log('🚀 ~ versionData:', versionData);
      return versionData?.version || null;
    }
    return null;
  } catch (error: any) {
    log(`Error reading version file: ${error.message}`);
    return null;
  }
};

// Function to check for updates
export const checkForUpdates = async (
  product = null,
): Promise<{
  update_available: boolean;
  server_version: string | null;
  userResponse: number | null;
  currentVersion: string | null;
}> => {
  let userResponse = null;
  let server_version_ = null;
  let currentVersion = null;
  try {
    currentVersion = await getCurrentVersion(product);
    log(`Checking for updates (current version: ${currentVersion})...`);

    let updateURL;
    if (product) {
      updateURL = `${UPDATE_CHECK_URL}?product=${encodeURIComponent(product)}`;
    } else {
      updateURL = `${UPDATE_CHECK_URL}?product=${encodeURIComponent(PRODUCT_NAME)}`;
    }

    log(`🚀 ~ updateURL: ${updateURL}`);

    const response = await fetch(updateURL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const message = `Error in check for updates`;
      return {
        update_available: false,
        server_version: '0',
        userResponse: 1,
        currentVersion: null,
      };
    }

    const { update_available, server_version: server_version_ } =
      await response.json();
    console.log(
      '🚀 ~ server_version:',
      server_version_,
      currentVersion,
      server_version_ !== currentVersion,
    );
    console.log('🚀 ~ update_available:', update_available);
    console.log(
      '🚀 ~ variables:',
      update_available,
      server_version_,
      currentVersion,
      update_available && server_version_ != currentVersion,
    );

    if (update_available && server_version_ != currentVersion && product) {
      log(`Update available: ${server_version_}`);
      userResponse = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Download', 'Later'],
        title: 'Update Available',
        message: `Version ${server_version_} is available. Would you like to download it now?`,
      });
      return {
        update_available,
        server_version: server_version_,
        userResponse,
        currentVersion,
      };
    } else if (update_available && server_version_ != currentVersion) {
      return {
        update_available,
        server_version: server_version_,
        userResponse: null,
        currentVersion,
      };
    } else {
      log('No updates available.');
      return {
        update_available: false,
        server_version: server_version_,
        userResponse: userResponse,
        currentVersion,
      };
    }
  } catch (error: any) {
    log(`Error checking for updates: ${error.message}`);
    return {
      update_available: false,
      server_version: server_version_,
      userResponse: userResponse,
      currentVersion,
    };
  }
};

// Function to download the update
// Function to download the update
export const downloadUpdate = async (
  url: string,
  productName = PRODUCT_NAME,
  destination = DOWNLOAD_DIR,
  requestPlatform?: string,
  requestArch?: string,
): Promise<string> => {
  try {
    log(
      `Downloading update from: ${url} ${productName} ${destination} ${requestPlatform} ${requestArch}`,
    );

    const urlConstructed = new URL(url);
    const params: {
      product: string;
      platform?: string;
      arch?: string;
      zip_files?: string;
    } = {
      product: productName,
    };

    if (requestPlatform) {
      params.platform = requestPlatform;
    }
    if (requestArch) {
      params.arch = requestArch;
    }
    if (!requestArch && !requestPlatform) {
      params.zip_files = 'true';
    }

    urlConstructed.search = new URLSearchParams(params).toString();
    log(`Params: ${urlConstructed.search}`);

    // Destination folder
    destination = path.join(destination, productName, 'updates');

    // Delete the destination folder if it exists
    if (fs.existsSync(destination)) {
      log(`1) Deleting existing destination folder: ${destination}`);
      fs.rmdirSync(destination, { recursive: true });
    }

    // Recreate the destination folder
    fs.mkdirSync(destination, { recursive: true });

    // Determine file path
    const fileName = 'update.zip'; // Default filename, update this logic if needed
    const filePath = path.join(destination, fileName);

    // Download using Axios
    const response: any = await downloadApp(
      urlConstructed.toString(),
      filePath,
    );

    // Check if the response was successful
    if (response.status !== 200) {
      const message = `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    log(`Update downloaded to: ${filePath}`);
    return filePath;
  } catch (error: any) {
    const message = `Error during update download: ${error.message}`;
    log(message);
    throw new Error(message); // Re-throw error for further handling
  }
};

// Function to extract the downloaded update
export const extractUpdate = async (
  filePath: string,
  destination: string,
): Promise<string> => {
  try {
    const extractDir = UPDATE_DIR; // path.join(UPDATE_DIR, 'extracted');
    log(`Extracting update to: ${extractDir}`);
    process.noAsar = true;
    await extractZip(filePath, extractDir);
    await extractZip(`${UPDATE_DIR}/app.asar.zip`, extractDir);
    // try {
    // } catch (error) {}
    return extractDir;
  } catch (error: any) {
    const message = `Error during extraction: ${error.message}`;
    log(message);
    return message;
  }
};
// Function to extract the downloaded update
export const extractSoftwareUpdate = async (
  filePath: string,
  destination: string,
): Promise<string> => {
  try {
    const extractDir = UPDATE_DIR; // path.join(UPDATE_DIR, 'extracted');
    log(`Extracting update to: ${extractDir}`);
    process.noAsar = true;
    await extractZip(filePath, extractDir);

    return extractDir;
  } catch (error: any) {
    const message = `Error during extraction: ${error.message}`;
    log(message);
    return message;
  }
};

// Function to install the extracted update
export const installUpdate = async (
  extractedPath: string,
  isUpdate: boolean,
) => {
  try {
    const applicationPath = path.dirname(app.getAppPath());

    if (isUpdate) {
      log('Installing update...');
      const asarPath = path.join(applicationPath, 'app.asar');
      const backupPath = path.join(applicationPath, 'app.asar_backup');
      const tempPath = path.join(applicationPath, 'app.asar_temp');
      const versionFile = path.join(extractedPath, 'version.yml');
      const targetVersionFile = path.join(applicationPath, 'version.yml');

      // Backup the current app.asar
      await fs.promises.copyFile(asarPath, backupPath);

      // Copy new app.asar to a temporary file
      await fs.promises.copyFile(
        path.join(extractedPath, 'app.asar'),
        tempPath,
      );

      // Replace the current app.asar with the new one
      await fs.promises.copyFile(tempPath, asarPath);

      // Copy the version file
      await fs.promises.copyFile(versionFile, targetVersionFile);

      // Remove temporary files after successful installation
      await fs.promises.unlink(backupPath).catch(() => {
        log(
          '🟥 Failed to remove app.asar_backup. It may not exist or is in use.',
        );
      });
      await fs.promises.unlink(tempPath).catch(() => {
        log(
          '🟥 Failed to remove app.asar_temp. It may not exist or is in use.',
        );
      });

      log('Update installed successfully.');
      // Delete the destination folder if it exists
      if (fs.existsSync(extractedPath)) {
        log(`2) Deleting existing destination folder: ${extractedPath}`);
        // @ts-ignore
        fs.rmdirSync(extractedPath, { recursive: true });
      }
    }

    // Relaunch the application after a short delay
    setTimeout(() => {
      log('Relaunching application...');
      app.relaunch();
      app.exit(0);
    }, 100);
  } catch (error: any) {
    const message = `Error during installation: ${error.message}`;
    log(message);
    return message;
  }
};

// Add this helper function at the top level
const findSqliteFilesRecursively = (dir: string): string[] => {
  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(dir, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      const subResults = findSqliteFilesRecursively(fullPath);
      results = results.concat(
        subResults.map((subPath) => path.join(relativePath, subPath)),
      );
    } else if (file.endsWith('.sqlite') || file.endsWith('.sqlite3')) {
      results.push(relativePath);
    }
  }

  return results;
};

export const installSoftware = async (
  extractedPath: string,
  productName: string,
  isUpdate: boolean,
): Promise<string | null> => {
  try {
    const appPath = path.dirname(app.getAppPath());
    const targetPath = path.join(appPath, productName);
    const backupPath = path.join(appPath, 'sqlite_backup');
    const tempPath = path.join(appPath, `${productName}_temp`);

    // Log installation start
    if (!isUpdate) {
      log(`Installing software... Extracted Path: ${extractedPath}`);
    }

    // Step 1: Create temp directory for new files
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
    fs.mkdirSync(tempPath, { recursive: true });

    // Step 2: Move extracted files to temp directory first
    const files = fs.readdirSync(extractedPath);
    for (const file of files) {
      const src = path.join(extractedPath, file);
      const dest = path.join(tempPath, file);
      fs.renameSync(src, dest);
    }

    // Step 3: Backup existing SQLite files if target exists
    const existingSqliteFiles = new Set<string>();
    if (fs.existsSync(targetPath)) {
      log(`Backing up .sqlite files from: ${targetPath}`);

      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }

      // Find all SQLite files recursively
      const sqliteFiles = findSqliteFilesRecursively(targetPath);

      for (const sqliteFile of sqliteFiles) {
        const src = path.join(targetPath, sqliteFile);
        const dest = path.join(backupPath, sqliteFile);

        // Ensure the destination directory exists
        fs.mkdirSync(path.dirname(dest), { recursive: true });

        fs.copyFileSync(src, dest);
        existingSqliteFiles.add(sqliteFile);
        log(`Backed up: ${src} -> ${dest}`);
      }
    }

    // Step 4: Clean target directory
    if (fs.existsSync(targetPath)) {
      log(`Cleaning up target path: ${targetPath}`);
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    fs.mkdirSync(targetPath, { recursive: true });

    // Step 5: Move new files from temp to target, excluding SQLite files that existed before
    const tempFiles = fs.readdirSync(tempPath);
    for (const file of tempFiles) {
      // Skip SQLite files that existed in the old version
      if (
        (file.endsWith('.sqlite') || file.endsWith('.sqlite3')) &&
        existingSqliteFiles.has(file)
      ) {
        log(`Skipping new SQLite file to preserve existing data: ${file}`);
        continue;
      }
      const src = path.join(tempPath, file);
      const dest = path.join(targetPath, file);
      fs.renameSync(src, dest);
    }

    // Step 6: Extract any ZIP files in the target path
    const zipFiles = fs
      .readdirSync(targetPath)
      .filter((file) => file.endsWith('.zip'));
    for (const zipFile of zipFiles) {
      const zipPath = path.join(targetPath, zipFile);
      log(`Extracting ZIP file: ${zipPath}`);
      await extractZip(zipPath, targetPath);
      fs.unlinkSync(zipPath);
      log(`Deleted ZIP file: ${zipPath}`);
    }

    // Step 7: Restore backed-up SQLite files
    if (fs.existsSync(backupPath)) {
      log(`Restoring .sqlite files to: ${targetPath}`);

      // Find all SQLite files recursively in backup
      const backupFiles = findSqliteFilesRecursively(backupPath);

      for (const backupFile of backupFiles) {
        const src = path.join(backupPath, backupFile);
        const dest = path.join(targetPath, backupFile);

        // Ensure the destination directory exists
        fs.mkdirSync(path.dirname(dest), { recursive: true });

        fs.copyFileSync(src, dest);
        log(`Restored: ${src} -> ${dest}`);
      }

      // Clean up backup directory
      fs.rmSync(backupPath, { recursive: true, force: true });
      log(`Cleaned up backup path: ${backupPath}`);
    }

    // Step 8: Clean up temp directory
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
      log(`Cleaned up temp path: ${tempPath}`);
    }

    // Find the binary inside 0_appLauncher
    const appLauncherPath = path.join(targetPath, '0_appLauncher');
    if (!fs.existsSync(appLauncherPath)) {
      log(`0_appLauncher folder not found: ${appLauncherPath}`);
      return null;
    }
    log(`Target path: ${targetPath}`);

    setExecutablePermissionsRecursively(targetPath);

    const launcherFiles = fs.readdirSync(appLauncherPath);

    // Look for executables (Windows: .exe, .bat; Others: Check executable flag)
    const binaryFile = launcherFiles.find((file) => {
      const filePath = path.join(appLauncherPath, file);
      const isFile = fs.statSync(filePath).isFile();
      const isExecutable =
        process.platform === 'win32'
          ? file.endsWith('.exe') ||
            file.endsWith('.bat') ||
            file.endsWith('.cmd') // Check extensions on Windows
          : (() => {
              try {
                fs.accessSync(filePath, fs.constants.X_OK); // Check if file is executable
                return true;
              } catch {
                return false;
              }
            })();
      return isFile && isExecutable;
    });

    if (binaryFile) {
      const binaryPath = path.join(appLauncherPath, binaryFile);
      log(`Binary found: ${binaryPath}`);

      // Set executable permissions only on Unix-like systems
      if (process.platform !== 'win32') {
        log(`Setting executable permissions for: ${binaryPath}`);
        fs.chmodSync(binaryPath, '755');
      }

      log(`Launcher is ready: ${binaryPath}`);
      return binaryPath;
    } else {
      log('No binary file found in 0_appLauncher.');
      return null;
    }
  } catch (error: any) {
    const message = `Error during installation: ${error.message}`;
    log(message);
    return message;
  }
};

export const getProductLauncher = async (productName: string) => {
  const appPath = path.dirname(app.getAppPath());
  const productPath = path.join(appPath, productName);

  if (!fs.existsSync(productPath)) {
    const message = `Product folder not found: ${productPath}`;
    log(message);
    // return message;
  }

  // Find the first folder matching "0_<anyString>"
  const subfolders = fs.readdirSync(productPath).filter((folder) => {
    const fullPath = path.join(productPath, folder);
    return fs.statSync(fullPath).isDirectory() && /^0_.+/.test(folder);
  });

  if (subfolders.length === 0) {
    // throw new Error(
    //   `No matching "0_<anyString>" folder found in ${productPath}`,
    // );
    // return '';
  }

  const appFolder = path.join(productPath, subfolders[0]);
  log(`App folder located: ${appFolder}`);

  // Find the binary file (assumes only one binary exists in the folder)
  const files = fs.readdirSync(appFolder).filter((file) => {
    const filePath = path.join(appFolder, file);
    const isFile = fs.statSync(filePath).isFile();
    const isExecutable =
      process.platform === 'win32'
        ? file.endsWith('.exe') ||
          file.endsWith('.bat') ||
          file.endsWith('.cmd') // Windows executables
        : (() => {
            try {
              fs.accessSync(filePath, fs.constants.X_OK); // Check if file is executable
              return true;
            } catch {
              return false;
            }
          })();
    return isFile && isExecutable;
  });

  if (files.length === 0) {
    // throw new Error(`No executable binary found in ${appFolder}`);
  }

  const binaryName = files[0];
  const binaryPath = path.join(appFolder, binaryName);
  log(`Binary found: ${binaryPath} `);
  log(`App Folder: ${appFolder} `);
  log(`Binary name: ${binaryName} `);
  return { appFolder, binaryName, binaryPath };
};

export const killSoftware = async (productName: string) => {
  const result = await getProductLauncher(productName);
  if (!result.appFolder) {
    return;
  }
  const { appFolder, binaryPath, binaryName } = result;
  log(`🚀 ~ killSoftware ~ binaryName: ${binaryName}`);
  log(`🚀 ~ killSoftware ~ binaryPath: ${binaryPath}`);
  log(`🚀 ~ killSoftware ~ appFolder: ${appFolder}`);

  const killing = spawn(`./${binaryName}`, ['--kill'], {
    cwd: appFolder, // Set the working directory to appFolder
    env: { ...process.env }, // Inherit parent process environment variables
    detached: true, // Allows the parent process to exit without killing the child process
    stdio: ['ignore', 'pipe', 'pipe'], // Capture output for debugging
  });
  return { appFolder, binaryPath, binaryName };
};

export const launchSoftware = async (productName: string): Promise<void> => {
  try {
    // @ts-ignore
    // const { appFolder, binaryPath, binaryName } =
    //   await killSoftware(productName);
    const result = await getProductLauncher(productName);
    if (!result.appFolder) {
      return;
    }
    const { appFolder, binaryPath, binaryName } = result;

    log(`🚀 ~ launchSoftware ~ binaryName: ${binaryName}`);
    log(`🚀 ~ launchSoftware ~ binaryPath: ${binaryPath}`);
    log(`🚀 ~ launchSoftware ~ appFolder: ${appFolder}`);

    await delay(3000);
    log(`Launching binary: ${binaryName} in working directory: ${appFolder}`);

    const startProcess = () => {
      if (childProcesses.has(productName)) {
        log(`⚠️ Binary ${binaryName} is already running. Skipping launch.`);
        return; // Prevent duplicate launches
      }

      const child: ChildProcess = spawn(`./${binaryName}`, [], {
        cwd: appFolder,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true, // Run launcher in its own process group

        windowsHide: true,
      });

      childProcesses.set(productName, child); // Track child process

      child.stdout?.on('data', (data) => {
        log(`Binary ${binaryName} stdout: ${data.toString().trim()}`);
      });

      child.stderr?.on('data', (data) => {
        log(`Binary ${binaryName} stderr: ${data.toString().trim()}`);
      });

      child.on('error', (err) => {
        log(`❌ Error in binary ${binaryName}: ${err.message}`);
      });

      child.on('close', (code, signal) => {
        log(
          `⚠️ Binary ${binaryName} exited with code: ${code}, signal: ${signal}`,
        );
        childProcesses.delete(productName); // Remove from tracking
        if (code !== 0) {
          log(`🔄 Relaunching ${binaryName}...`);
          setTimeout(startProcess, 0);
        }
      });

      log(`✅ Binary ${binaryName} launched with PID: ${child.pid}`);
    };

    startProcess();

    mainWindow.webContents.send('dependencies-launch-status', {
      stage: 'Dependencies Started',
      progress: 100,
    });
  } catch (error: any) {
    const message = `Error launching binary: ${error.message}\nStack: ${error.stack}`;
    log(message);
  } finally {
    // Ensure all child processes are killed
    app.on('before-quit', () => {
      console.log('Shutting down Electron app...');

      childProcesses.forEach((child, productName) => {
        console.log(
          `Terminating launcher for ${productName} with PID: ${child.pid}`,
        );

        if (process.platform === 'win32') {
          // Use taskkill on Windows
          exec(`taskkill /PID ${child.pid} /T /F`, (err) => {
            if (err) {
              console.error(`Failed to kill process ${child.pid}:`, err);
            }
          });
        } else {
          // Send SIGTERM to the process group on Unix
          if (child.pid) {
            process.kill(-child.pid);
          }
        }

        childProcesses.delete(productName);
      });
    });
  }
};

// Cleanup function to terminate all running processes
export const cleanupProcesses = () => {
  log('Cleaning up all running processes...');
  childProcesses.forEach((child, productName) => {
    if (!child.killed) {
      log(`Terminating ${productName} (PID: ${child.pid})`);
      child.kill('SIGTERM'); // Graceful termination
    }
  });
  childProcesses.clear();
};

export const installSoftwareUpdate = async (
  productName: string,
  requestPlatform: string,
  requestArch: string,
) => {
  app.whenReady().then(async () => {
    try {
      log(
        `🔥 Installing software update : ${DOWNLOAD_URL}, ${productName}, ${DOWNLOAD_DIR},${requestPlatform},${requestArch}`,
      );
      mainWindow.webContents.send('update-progress', {
        stage: 'Downloading update ...',
        progress: 10,
      });
      const downloadPath = await downloadUpdate(
        DOWNLOAD_URL,
        productName,
        DOWNLOAD_DIR,
        requestPlatform,
        requestArch,
      );

      log(`Update downloaded to: ${downloadPath}`);
      mainWindow.webContents.send('update-progress', {
        stage: 'Extracting update',
        progress: 25,
      });
      const appPath = path.dirname(app.getAppPath());

      // Step 3: Extract the downloaded update
      const extractedPath = await extractSoftwareUpdate(downloadPath, appPath);
      log(`Update extracted to: ${extractedPath}`);
      mainWindow.webContents.send('update-progress', {
        stage: 'Update extracted',
        progress: 50,
      });
      mainWindow.webContents.send('update-progress', {
        stage: 'Installing Software ...',
        progress: 75,
      });

      // Step 4: Install the update
      await installSoftware(extractedPath, productName, false);
      log('Update installation complete.');
      mainWindow.webContents.send('update-progress', {
        stage: 'Software installed',
        progress: 100,
      });
      mainWindow.webContents.send('update-complete', {
        stage: 'Software installed',
        progress: 100,
      });
      // Delete the destination folder if it exists
      if (fs.existsSync(extractedPath)) {
        log(`3) Deleting existing destination folder: ${extractedPath}`);
        // @ts-ignore
        fs.rmdirSync(extractedPath, { recursive: true });
      }
    } catch (error: any) {
      log(`Error during the update process: ${error.message}`);
      mainWindow.webContents.send('update-error', {
        message: `${error.message} ${DOWNLOAD_URL}, ${productName}, ${DOWNLOAD_DIR},${requestPlatform},${requestArch}`,
      });
    }
  });
};

export const autoUpdateInstaller = async () => {
  // Step 1: Check for updates
  const { currentVersion, update_available, server_version, userResponse } =
    await checkForUpdates();

  if (update_available) {
    // User chose to download the update
    log(
      `User accepted update. Proceeding to download version ${server_version}...`,
    );

    mainWindow.webContents.send('update-progress', {
      stage: 'downloading',
      progress: 0,
    });

    // Step 2: Download the update
    const downloadPath = await downloadUpdate(
      DOWNLOAD_URL,
      PRODUCT_NAME,
      DOWNLOAD_DIR,
    );
    mainWindow.webContents.send('update-progress', {
      stage: 'downloaded',
      progress: 33,
    });

    log(`Update downloaded to: ${downloadPath}`);
    mainWindow.webContents.send('update-progress', {
      stage: 'extracting',
      progress: 33,
    });

    // Step 3: Extract the downloaded update
    const extractedPath = await extractUpdate(downloadPath, DOWNLOAD_DIR);
    log(`Update extracted to: ${extractedPath}`);
    mainWindow.webContents.send('update-progress', {
      stage: 'extracted',
      progress: 66,
    });
    mainWindow.webContents.send('update-progress', {
      stage: 'installing',
      progress: 66,
    });

    // Step 4: Install the update
    await installUpdate(extractedPath, true);
    log('Update installation complete.');
    mainWindow.webContents.send('update-progress', {
      stage: 'installed',
      progress: 100,
    });

    // Delete the destination folder if it exists
    // @ts-ignore
    if (fs.existsSync(extractedPath)) {
      log(`4) Deleting existing destination folder: ${extractedPath}`);
      // @ts-ignore
      fs.rmdirSync(extractedPath, { recursive: true });
    }
  } else if (update_available) {
    log('User chose to delay the update.');
  } else {
    log('No updates available.');
  }
};
export const initializeAutoUpdater = async (inputMainWindow: any) => {
  log('Custom updater initialized');
  mainWindow = inputMainWindow;
};
