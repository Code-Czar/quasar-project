import { app, dialog } from 'electron';
import { log } from 'electron-log';
import { extractZip } from './utils';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const UPDATE_CHECK_URL = 'https://beniben.hopto.org/user/check-for-updates';
const DOWNLOAD_URL = 'https://beniben.hopto.org/user/download-updates';
const PRODUCT_NAME = 'InfinityInstaller';
const DOWNLOAD_DIR = path.dirname(app.getPath('userData'));

let mainWindow: any | null = null;

// Utility function to read the current app version
export const getCurrentVersion = async (): Promise<string | null> => {
  try {
    const versionPath = path.join(
      path.dirname(app.getAppPath()),
      'version.yml',
    );
    if (fs.existsSync(versionPath)) {
      const versionFile = await fs.promises.readFile(versionPath, 'utf8');
      const versionData = yaml.load(versionFile);
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
  product = PRODUCT_NAME,
): Promise<{
  update_available: boolean;
  server_version: string | null;
  userResponse: number | null;
}> => {
  try {
    const currentVersion = await getCurrentVersion();
    log(`Checking for updates (current version: ${currentVersion})...`);

    const response = await fetch(UPDATE_CHECK_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: currentVersion, product }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check updates: ${response.statusText}`);
    }

    const { update_available, server_version } = await response.json();

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
    log(`Downloading update from: ${url}`);
    const urlConstructed = new URL(url);
    const params: { product: string; platform?: string; arch?: string } = {
      product: productName,
      platform: requestPlatform,
      arch: requestArch,
    };
    urlConstructed.search = new URLSearchParams(params).toString();

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
    const extractDir = path.join(destination, 'extracted');
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
    const resourcesPath = path.dirname(app.getAppPath());

    if (isUpdate) {
      log('Installing update...');
      const asarPath = path.join(resourcesPath, 'app.asar');
      const backupPath = path.join(resourcesPath, 'app.asar_backup');
      const tempPath = path.join(resourcesPath, 'app.asar_temp');
      const versionFile = path.join(extractedPath, 'version.yml');
      const targetVersionFile = path.join(resourcesPath, 'version.yml');

      await fs.promises.copyFile(asarPath, backupPath);
      await fs.promises.copyFile(
        path.join(extractedPath, 'app.asar'),
        tempPath,
      );
      await fs.promises.copyFile(tempPath, asarPath);
      await fs.promises.copyFile(versionFile, targetVersionFile);
      log('Update installed successfully.');
    } else {
      log('Installing software...');
      // Add installation logic for new software here if needed
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

export const installSoftwareUpdate = async (
  productName: string,
  requestPlatform: string,
  requestArch: string,
) => {
  log('Custom updater initialized');
  // mainWindow = inputMainWindow;

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
          productName,
          DOWNLOAD_DIR,
          requestPlatform,
          requestArch,
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
