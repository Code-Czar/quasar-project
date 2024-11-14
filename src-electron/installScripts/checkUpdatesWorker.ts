// src-electron/installScripts/checkUpdatesWorker.ts
const { parentPort, workerData } = require('worker_threads');

const { checkForUpdates: checkForUpdates_ } = require('./buildSources'); // Adjust the path to your module
// const { ipcRenderer } = require('electron');

async function runUpdateCheck(productId: string, resourcesPath) {
  // console.log('🚀 ~ runUpdateCheck ~ productId:', productId);
  // parentPort.postMessage(`${resourcesPath}`);
  // parentPort.postMessage(`Worker initialized ${productId}`);
  try {
    const result = await checkForUpdates_(productId, resourcesPath);
    parentPort.postMessage(result);
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

// Extract `productId` from workerData
const { productId, resourcesPath } = workerData;

// Call the function with the passed `productId`
runUpdateCheck(productId, resourcesPath);
