"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
console.log('🚀 Platform:', platform);
console.log('🚀 Architecture:', arch);
// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    installDocker: (productId) => ipcRenderer.invoke('install-dependencies', productId),
    checkContainers: () => ipcRenderer.invoke('check-docker-containers'),
    checkForUpdates: (productName) => ipcRenderer.invoke('check-for-updates', productName, platform, arch),
    installSoftwareUpdate: (productName) => ipcRenderer.invoke('install-software-update', productName, platform, arch),
    launchSoftware: (productName) => ipcRenderer.invoke('launch-software', productName),
    navigateTo: (url) => ipcRenderer.send('navigate-to-url', url),
    authRedirect: (url) => ipcRenderer.send('auth-redirect', url),
    sendFeedback: (feedbackData) => ipcRenderer.invoke('send-feedback', feedbackData),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
    onDependenciesLaunchStatus: (callback) => ipcRenderer.on('dependencies-launch-status', callback),
    onUpdateComplete: (callback) => ipcRenderer.on('update-complete', callback),
    onUpdateError: (callback) => ipcRenderer.on('update-error', callback),
    handleStripe: (action, redirectUrl) => ipcRenderer.invoke('handle-stripe', { action, redirectUrl }),
});
// Helper function for navigating
const handleNavigation = (url) => {
    console.log('🚀 Handling Navigation for URL:', url);
    if (url.startsWith('infinityinstaller://')) {
        const eventDetails = { detail: url };
        if (url.includes('subscription_success')) {
            // const stripeWindow = window.opener;
            // if (stripeWindow && !stripeWindow.closed) {
            //   stripeWindow.close();
            //   console.log('Stripe checkout window closed.');
            // }
            // @ts-ignore
            // window.electronAPI.handleStripe('redirect', 'subscription_success');
            ipcRenderer.invoke('handle-stripe', {
                action: 'redirect',
                redirectUrl: 'subscription_success',
                url,
            });
            // window.dispatchEvent(new CustomEvent('navigate-to-url', eventDetails));
        }
        else if (url.includes('auth')) {
            const queryParams = new URL(url).searchParams;
            const routePath = '/auth';
            const accessToken = queryParams.get('access_token');
            console.log('🚀 Auth Navigation Params:', { queryParams, accessToken });
            window.dispatchEvent(new CustomEvent('navigate-to-url', eventDetails));
        }
        else {
            window.location.href = url;
        }
    }
    else {
        console.error('Invalid Protocol:', url);
    }
};
// Listen for navigation-related events
ipcRenderer.on('navigate-to-url', (event, url) => handleNavigation(url));
ipcRenderer.on('protocol-invoked', (event, url) => handleNavigation(url));
