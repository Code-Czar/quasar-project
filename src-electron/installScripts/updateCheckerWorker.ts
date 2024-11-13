// src-electron/installScripts/checkUpdatesWorker.ts
const { checkForUpdates: checkForUpdates_ } = require('./buildSources'); // Adjust the path to your module
// const { ipcRenderer } = require('electron');

async function runUpdateCheck(productId: string) {
  try {
    const result = await checkForUpdates_(productId);
    process.send?.(result); // Send the result back to the parent process
  } catch (error) {
    console.error('Failed to check for updates:', error);
    process.send?.({ shouldUpdate: false, error: error.message });
  }
}

// Listen for productId from the main process and trigger update check
process.on('message', (message: { productId: string }) => {
  runUpdateCheck(message.productId);
});
