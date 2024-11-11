// preload.js
const { contextBridge, ipcRenderer } = require('electron');
// const { remote } = require('@electron/remote');

contextBridge.exposeInMainWorld('electronAPI', {
  installDocker: () => ipcRenderer.invoke('install-dependencies'),
  checkContainers: () => ipcRenderer.invoke('check-docker-containers'),
  navigateTo: (url) => ipcRenderer.send('navigate-to-url', url), // Add navigate function
  // remoteMethod: (methodName: string, ...args: any[]) =>
  //   remote[methodName](...args),
});

ipcRenderer.on('auth-callback', (event, data) => {
  console.log('Access Token:', data.accessToken);
  console.log('Refresh Token:', data.refreshToken);
  // Store or use the token as needed
});
