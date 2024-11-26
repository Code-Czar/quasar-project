import { app, dialog } from 'electron';
import { extractZip, logger as log } from './utils';
import { spawn } from 'child_process';

import axios from 'axios';
import fs from 'fs';
import path from 'path';
// import log from 'electron-log';
import yaml from 'js-yaml';

const UPDATE_CHECK_URL = 'https://beniben.hopto.org/user/check-for-updates'; // Replace with your backend URL
const DOWNLOAD_URL = 'https://beniben.hopto.org/user/download-updates'; // Replace with your backend URL
const PRODUCT_NAME = 'InfinityInstaller'; // Replace with your backend URL
const DOWNLOAD_DIR = path.join(app.getPath('userData'), 'updates');

export const initializeAutoUpdater = (mainWindow) => {
  log('Custom updater initialized');
  const getCurrentVersion = async () => {
    try {
      const appPath = app.getAppPath();
      const versionPath = path.join(path.dirname(appPath), 'version.yml');

      if (fs.existsSync(versionPath)) {
        const versionFile = await fs.promises.readFile(versionPath, 'utf8');
        const versionData = yaml.load(versionFile);
        return versionData.version || null;
      }
      return null;
    } catch (error) {
      log('Error reading version file:', error.message);
      return null;
    }
  };

  const checkForUpdates = async () => {
    try {
      const currentVersion = await getCurrentVersion();
      log(`Checking for updates (current version: ${currentVersion})...`);

      // Call the backend to check for updates
      const response = await axios.get(UPDATE_CHECK_URL, {
        params: { version: currentVersion, product: PRODUCT_NAME },
        // params: { product: PRODUCT_NAME },
      });
      console.log('🚀 ~ checkForUpdates ~ response:', response);

      const { update_available, server_version } = response.data;

      if (update_available) {
        log(`Update available: ${server_version}`);
        const userResponse = dialog.showMessageBoxSync({
          type: 'info',
          buttons: ['Download', 'Later'],
          title: 'Update Available',
          message: `Version ${server_version} is available. Would you like to download it now?`,
        });

        if (userResponse === 0) {
          // User chose to download the update
          const downloadFolder = await downloadUpdate(DOWNLOAD_URL);
          handleUpdateReady(downloadFolder);
        }
      } else {
        dialog.showMessageBoxSync({
          type: 'info',
          title: 'No Updates',
          message: 'You are already using the latest version.',
        });
      }
    } catch (error) {
      log('Error checking for updates:', error.message);
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates. Please try again later.',
      });
    }
  };

  const downloadUpdate = async (url) => {
    try {
      log(`Downloading update from: ${url}`);
      const urlConstructed = new URL(url);
      urlConstructed.search = new URLSearchParams({ product: PRODUCT_NAME });
      log(urlConstructed.search);

      const response = await fetch(urlConstructed, {
        method: 'GET',
        headers: { 'Content-Type': 'application/zip' },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      if (!fs.existsSync(DOWNLOAD_DIR))
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition
        ? contentDisposition.match(/filename="?([^"]+)"?/)[1]
        : 'update.zip';
      const filePath = path.join(DOWNLOAD_DIR, fileName);

      log(`Saving update to: ${filePath}`);
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(filePath, Buffer.from(buffer));

      log(`Update downloaded to: ${filePath}`);

      if (fileName.endsWith('.zip')) {
        const extractDir = path.join(DOWNLOAD_DIR, 'extracted');
        const appPath = app.getAppPath();

        const resourcesPath = path.dirname(appPath);
        const asarPath = path.join(resourcesPath, 'app.asar');
        const asarPathBackup = path.join(resourcesPath, 'app.asar_backup');
        const asarPathZip = path.join(extractDir, 'app.asar.zip');
        const updateAsar = path.join(extractDir, 'app.asar');
        const tempAsarPath = path.join(resourcesPath, 'app.asar_temp');
        const versionFile = path.join(extractDir, 'version.yml');
        const targetVersionFile = path.join(resourcesPath, 'version.yml');

        log(`Extracting update to: ${extractDir}`);
        process.noAsar = true;
        await extractZip(filePath, extractDir);
        await extractZip(asarPathZip, extractDir);

        log(`Preparing temporary asar file at: ${tempAsarPath}`);
        await fs.promises.copyFile(updateAsar, tempAsarPath);

        log(
          `Updating version file from ${versionFile} to ${targetVersionFile}`,
        );
        await fs.promises.copyFile(versionFile, targetVersionFile);

        // Schedule app relaunch and replacement
        log(`Replacing app.asar with the temporary file: ${tempAsarPath}`);
        await fs.promises.copyFile(asarPath, asarPathBackup);
        await fs.promises.copyFile(updateAsar, asarPath);
        // await fs.promises.rename(tempAsarPath, asarPath); // Replace the old asar
        log(`Successfully replaced app.asar: ${asarPath}`);
        // app.on('will-quit', async () => {
        //   try {
        //     log(`Replacing app.asar with the temporary file: ${tempAsarPath}`);
        //     await fs.promises.rename(tempAsarPath, asarPath); // Replace the old asar
        //     log(`Successfully replaced app.asar: ${asarPath}`);
        //   } catch (error) {
        //     log.error(`Error replacing app.asar: ${error.message}`);
        //   }
        // });
        const userDataPath = app.getPath('userData');
        log(`Clearing Electron cache at: ${userDataPath}`);
        await fs.promises.rm(tempAsarPath, { recursive: true, force: true });
        await fs.promises.rm(asarPathBackup, { recursive: true, force: true });

        // await fs.promises.rm(userDataPath, { recursive: true, force: true });
        log(`Cache cleared.`);
        setTimeout(() => {
          log('Quitting the application to apply the update...');
          app.relaunch();
          // app.quit();
          app.exit(0);
        }, 1000);
      }
    } catch (error) {
      log('Error during update download:', error.message);
      throw error;
    }
  };

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
  app.whenReady().then(() => {
    checkForUpdates();
  });
};
