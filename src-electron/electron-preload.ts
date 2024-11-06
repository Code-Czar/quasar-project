// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  installDocker: () => ipcRenderer.invoke('install-dependencies'),
  navigateTo: (url) => ipcRenderer.send('navigate-to-url', url), // Add navigate function
});
