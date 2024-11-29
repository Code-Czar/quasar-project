"use strict";
// electron-preload.ts
const { contextBridge, ipcRenderer } = require('electron');
// const { logger: log } = require('./utils');
// const { remote } = require('@electron/remote');
contextBridge.exposeInMainWorld('electronAPI', {
    installDocker: (productId, callback) => ipcRenderer.invoke('install-dependencies', productId),
    checkContainers: () => ipcRenderer.invoke('check-docker-containers'),
    checkForUpdates: (productName, requestPlatform, requestArch) => ipcRenderer.invoke('check-for-updates', productName, requestPlatform, requestArch),
    navigateTo: (url) => ipcRenderer.send('navigate-to-url', url), // Add navigate function
    authRedirect: (url) => ipcRenderer.send('auth-redirect', url), // Add navigate function
    // remoteMethod: (methodName: string, ...args: any[]) =>
    //   remote[methodName](...args),
});
ipcRenderer.on('auth-callback', (event, data) => {
    // log('Access Token:', data);
    // log('Access Token:', data.accessToken);
    // log('Refresh Token:', data.refreshToken);
    // Store or use the token as needed
});
ipcRenderer.on('navigate-to-url', (event, url) => {
    // const { logger: log } = require('./utils');
    console.log('🚀 1) Navigate to URL:', url);
    if (url.startsWith('infinityinstaller://')) {
        console.log('🚀 2) Navigate to URL:', url);
        // Assuming Vue Router is available in the renderer process
        const queryParams = new URL(url).searchParams;
        const routePath = '/auth'; // Adjust this based on your route configuration
        const accessToken = queryParams.get('access_token');
        console.log('🚀 3) Navigation params:', queryParams);
        console.log('🚀 4) Token:', accessToken);
        // Use Vue Router to navigate
        // window.router.push({
        //   path: routePath,
        //   query: { token: accessToken },
        // });
        window.dispatchEvent(new CustomEvent('navigate-to-url', { detail: url }));
    }
    else {
        window.location.href = url;
        // mainWindow?.loadURL(url);
    }
});
// ipcRenderer.on('check-for-updates', (url) => {
//   // const { logger: log } = require('./utils');
//   console.log('🚀 IPC check for updates:', url);
// });
