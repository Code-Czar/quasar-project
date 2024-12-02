import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { app, dialog } from 'electron';
import { spawn } from 'child_process';
// import { log } from 'electron-log';
import { logger as log } from './logger';
import { extractZip } from './utils';

const UPDATE_CHECK_URL = 'https://beniben.hopto.org/user/check-for-updates';
const DOWNLOAD_URL = 'https://beniben.hopto.org/user/download-updates';
const PRODUCT_NAME = 'InfinityInstaller';
const DOWNLOAD_DIR = path.dirname(app.getPath('userData'));
const UPDATE_DIR = `${DOWNLOAD_DIR}/${PRODUCT_NAME}/updates`;

let mainWindow: any | null = null;

/**
 * Recursively sets executable permissions for all files in a directory.
 * @param dirPath The path to the directory to process.
 */
const setExecutablePermissionsRecursively = (dirPath: string): void => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      setExecutablePermissionsRecursively(entryPath);
    } else if (entry.isFile()) {
      // Set executable permissions for files
      fs.chmodSync(entryPath, '755'); // chmod +x
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
}> => {
  try {
    const currentVersion = await getCurrentVersion(product);
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
      throw new Error(`Failed to check updates: ${response.statusText}`);
    }

    const { update_available, server_version } = await response.json();
    console.log('🚀 ~ server_version:', server_version);
    console.log('🚀 ~ update_available:', update_available);

    if (update_available) {
      log(`Update available: ${server_version}`);
      const userResponse = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Download', 'Later'],
        title: 'Update Available',
        message: `Version ${server_version} is available. Would you like to download it now?`,
      });
      return { update_available, server_version, userResponse };
    } else {
      log('No updates available.');
      return {
        update_available: false,
        server_version: null,
        userResponse: null,
      };
    }
  } catch (error: any) {
    log(`Error checking for updates: ${error.message}`);
    return {
      update_available: false,
      server_version: null,
      userResponse: null,
    };
  }
};

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

    const response = await fetch(urlConstructed.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/zip' },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    if (!destination) {
      destination = DOWNLOAD_DIR;
    }

    destination = path.join(destination, productName, 'updates');
    if (!fs.existsSync(destination))
      fs.mkdirSync(destination, { recursive: true });

    const fileName =
      // @ts-ignore
      response.headers
        .get('content-disposition')
        ?.match(/filename="?([^"]+)"?/)[1] || 'update.zip';
    const filePath = path.join(destination, fileName);

    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    log(`Update downloaded to: ${filePath}`);
    return filePath;
  } catch (error: any) {
    log(`Error during update download: ${error.message}`);
    throw error;
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
    log(`Error during extraction: ${error.message}`);
    throw error;
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
    log(`Error during extraction: ${error.message}`);
    throw error;
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

      await fs.promises.copyFile(asarPath, backupPath);
      await fs.promises.copyFile(
        path.join(extractedPath, 'app.asar'),
        tempPath,
      );
      await fs.promises.copyFile(tempPath, asarPath);
      await fs.promises.copyFile(versionFile, targetVersionFile);
      log('Update installed successfully.');
    }

    setTimeout(() => {
      log('Relaunching application...');
      app.relaunch();
      app.exit(0);
    }, 1000);
  } catch (error: any) {
    log(`Error during installation: ${error.message}`);
    throw error;
  }
};

// Function to install the extracted update
export const installSoftware = async (
  extractedPath: string,
  productName: string,
  isUpdate: boolean,
): Promise<string | null> => {
  try {
    const appPath = path.dirname(app.getAppPath());
    const targetPath = path.join(appPath, productName);

    // Log installation start
    if (!isUpdate) {
      log(`Installing software... Extracted Path: ${extractedPath}`);
    }

    // Ensure the target path is cleaned before extracting
    if (fs.existsSync(targetPath)) {
      log(`Cleaning up target path: ${targetPath}`);
      fs.rmSync(targetPath, { recursive: true, force: true }); // Remove folder and contents
      log(`Target path cleaned: ${targetPath}`);
    }

    // Recreate the target path
    fs.mkdirSync(targetPath, { recursive: true });
    log(`Recreated target path: ${targetPath}`);

    // Move all extracted files to the target path
    const files = fs.readdirSync(extractedPath);
    for (const file of files) {
      const src = path.join(extractedPath, file);
      const dest = path.join(targetPath, file);
      log(`Moving: ${src} -> ${dest}`);
      fs.renameSync(src, dest);
    }

    // Extract ZIP files in the target path
    const zipFiles = fs
      .readdirSync(targetPath)
      .filter((file) => file.endsWith('.zip'));
    for (const zipFile of zipFiles) {
      const zipPath = path.join(targetPath, zipFile);

      log(`Extracting ZIP file: ${zipPath}`);
      await extractZip(zipPath, targetPath); // Use extractZip to extract the file
      log(`Extracted ZIP file: ${zipPath}`);

      // Optionally delete the ZIP file after extraction
      fs.unlinkSync(zipPath);
      log(`Deleted ZIP file: ${zipPath}`);
    }

    // Find the binary inside 0_appLauncher
    const appLauncherPath = path.join(targetPath, '0_appLauncher');
    if (!fs.existsSync(appLauncherPath)) {
      log(`0_appLauncher folder not found: ${appLauncherPath}`);
      return null;
    }

    setExecutablePermissionsRecursively(appLauncherPath);

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
    log(`Error during installation: ${error.message}`);
    throw error;
  }
};

export const launchSoftware = async (productName: string): Promise<void> => {
  try {
    const appPath = path.dirname(app.getAppPath());
    const productPath = path.join(appPath, productName);

    if (!fs.existsSync(productPath)) {
      throw new Error(`Product folder not found: ${productPath}`);
    }

    // Find the first folder matching "0_<anyString>"
    const subfolders = fs.readdirSync(productPath).filter((folder) => {
      const fullPath = path.join(productPath, folder);
      return fs.statSync(fullPath).isDirectory() && /^0_.+/.test(folder);
    });

    if (subfolders.length === 0) {
      throw new Error(
        `No matching "0_<anyString>" folder found in ${productPath}`,
      );
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
      throw new Error(`No executable binary found in ${appFolder}`);
    }

    const binaryName = files[0];
    const binaryPath = path.join(appFolder, binaryName);
    log(`Binary found: ${binaryPath}`);

    // Launch the binary
    log(`Launching binary: ${binaryName} in working directory: ${appFolder}`);
    const child = spawn(`./${binaryName}`, [], {
      cwd: appFolder, // Set the working directory to appFolder
      env: { ...process.env }, // Inherit parent process environment variables
      detached: true, // Allows the parent process to exit without killing the child process
      stdio: ['ignore', 'pipe', 'pipe'], // Capture output for debugging
    });

    child.stdout?.on('data', (data) => {
      log(`Binary stdout: ${data.toString()}`);
    });

    child.stderr?.on('data', (data) => {
      log(`Binary stderr: ${data.toString()}`);
    });

    child.on('error', (err) => {
      log(`Child process error: ${err.message}`);
    });

    child.on('close', (code) => {
      log(`Binary process exited with code: ${code}`);
    });

    child.unref(); // Detach the child process

    mainWindow.webContents.send('dependencies-launch-status', {
      stage: 'Dependencies Started',
      progress: 100,
    });
  } catch (error: any) {
    log(`Error launching binary: ${error.message}`);
    throw error;
  }
};

export const installSoftwareUpdate = async (
  productName: string,
  requestPlatform: string,
  requestArch: string,
) => {
  log(
    'Custom updater initialized : $ {productName} ${requestPlatform} ${requestArch}',
  );
  // mainWindow = inputMainWindow;

  app.whenReady().then(async () => {
    try {
      // Step 1: Check for updates
      // // const { update_available, server_version, userResponse } =
      // //   await checkForUpdates(productName);

      // // if (update_available && userResponse === 0) {
      //   // User chose to download the update
      //   log(
      //     `User accepted update. Proceeding to download version ${server_version}...`,
      //   );

      // Step 2: Download the update
      log(
        `🔥 Installing software update : ${DOWNLOAD_URL}, ${productName}, ${DOWNLOAD_DIR},${requestPlatform},${requestArch}`,
      );
      mainWindow.webContents.send('update-progress', {
        stage: 'Downloading update ...',
        progress: 50,
      });
      const downloadPath = await downloadUpdate(
        DOWNLOAD_URL,
        productName,
        DOWNLOAD_DIR,
        requestPlatform,
        requestArch,
      );
      // mainWindow.webContents.send('update-progress', {
      //   stage: 'downloading',
      //   progress: 50,
      // });

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
      // } else if (update_available) {
      //   log('User chose to delay the update.');
      // } else {
      //   log('No updates available.');
      // }
    } catch (error: any) {
      log(`Error during the update process: ${error.message}`);
      mainWindow.webContents.send('update-error', {
        message: `${error.message} ${DOWNLOAD_URL}, ${productName}, ${DOWNLOAD_DIR},${requestPlatform},${requestArch}`,
      });
    }
  });
};
export const initializeAutoUpdater = async (inputMainWindow: any) => {
  log('Custom updater initialized');
  mainWindow = inputMainWindow;

  app.whenReady().then(async () => {
    try {
      // Step 1: Check for updates
      const { update_available, server_version, userResponse } =
        await checkForUpdates();

      if (update_available && userResponse === 0) {
        // User chose to download the update
        log(
          `User accepted update. Proceeding to download version ${server_version}...`,
        );

        // Step 2: Download the update
        const downloadPath = await downloadUpdate(
          DOWNLOAD_URL,
          PRODUCT_NAME,
          DOWNLOAD_DIR,
        );
        mainWindow.webContents.send('update-progress', {
          stage: 'downloading',
          progress: 50,
        });

        log(`Update downloaded to: ${downloadPath}`);
        mainWindow.webContents.send('update-progress', {
          stage: 'extracting',
          progress: 50,
        });

        // Step 3: Extract the downloaded update
        const extractedPath = await extractUpdate(downloadPath, DOWNLOAD_DIR);
        log(`Update extracted to: ${extractedPath}`);
        mainWindow.webContents.send('update-progress', {
          stage: 'extracted',
          progress: 50,
        });
        mainWindow.webContents.send('update-progress', {
          stage: 'installing',
          progress: 50,
        });

        // Step 4: Install the update
        await installUpdate(extractedPath, true);
        log('Update installation complete.');
        mainWindow.webContents.send('update-progress', {
          stage: 'installed',
          progress: 50,
        });
      } else if (update_available) {
        log('User chose to delay the update.');
      } else {
        log('No updates available.');
      }
    } catch (error: any) {
      log(`Error during the update process: ${error.message}`);
      mainWindow.webContents.send('update-error', { message: error.message });
    }
  });
};
