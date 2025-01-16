const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const os = require('os');

const platform = os.platform();
const arch = os.arch();

console.log('🚀 Platform:', platform);
console.log('🚀 Architecture:', arch);

// Instead of exposing navigator directly, we'll extend the existing navigator object
contextBridge.exposeInMainWorld('customNavigator', {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  userAgentData: {
    brands: [
      { brand: 'Google Chrome', version: '119' },
      { brand: 'Chromium', version: '119' },
    ],
    mobile: false,
  },
});

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  initWebSocket: () => ipcRenderer.invoke('init-websocket'),
  checkInstallerUpdates: () => ipcRenderer.invoke('check-installer-updates'),

  checkForUpdates: (productName: string) =>
    ipcRenderer.invoke('check-for-updates', productName, platform, arch),
  installSoftwareUpdate: (productName: string) =>
    ipcRenderer.invoke('install-software-update', productName, platform, arch),
  launchSoftware: (productName: string) =>
    ipcRenderer.invoke('launch-software', productName),
  killSoftware: (productName: string) =>
    ipcRenderer.invoke('kill-software', productName),
  navigateTo: (url: string) => ipcRenderer.send('navigate-to-url', url),
  authRedirect: (url: string) => ipcRenderer.invoke('handle-auth', url),
  sendFeedback: (feedbackData: any) =>
    ipcRenderer.invoke('send-feedback', feedbackData),
  onUpdateProgress: (callback: any) =>
    ipcRenderer.on('update-progress', callback),
  onDependenciesLaunchStatus: (callback: any) =>
    ipcRenderer.on('dependencies-launch-status', callback),
  onUpdateComplete: (callback: any) =>
    ipcRenderer.on('update-complete', callback),
  onUpdateError: (callback: any) => ipcRenderer.on('update-error', callback),
  handleStripe: (action: string, redirectUrl: string) =>
    ipcRenderer.invoke('handle-stripe', { action, redirectUrl }),
});

// Helper function for navigating
const handleNavigation = (url: string) => {
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
    } else if (url.includes('auth')) {
      const queryParams = new URL(url).searchParams;
      const routePath = '/auth';
      const accessToken = queryParams.get('access_token');
      console.log('🚀 Auth Navigation Params:', {
        queryParams,
        accessToken,
        url,
        eventDetails,
      });
      ipcRenderer.invoke('handle-auth', {
        action: 'redirect',
        redirectUrl: '/auth',
        url,
      });

      // window.dispatchEvent(new CustomEvent('navigate-to-auth', eventDetails));
    } else {
      window.location.href = url;
    }
  } else {
    console.error('Invalid Protocol:', url);
  }
};

// Listen for navigation-related events
ipcRenderer.on('navigate-to-url', (event, url) => handleNavigation(url));
ipcRenderer.on('protocol-invoked', (event, url) => handleNavigation(url));
// Alternatively, directly listen for the IPC event and dispatch the DOM event
// ipcRenderer.on('navigate-to-auth', (event, url) => {
//   const customEvent = new CustomEvent('navigate-to-auth', { detail: url });
//   console.log('🚀 ~ ipcRenderer.on ~ customEvent:', customEvent);

//   // Get all open Electron windows
//   const allWindows = BrowserWindow.getAllWindows();

//   // Identify the main window (assuming it's the first one or by custom logic)
//   const mainWindow = allWindows[0]; // Adjust logic if needed to identify the main window

//   if (mainWindow) {
//     // Dispatch event to the main window
//     mainWindow.webContents.executeJavaScript(`
//       const event = new CustomEvent('navigate-to-auth', { detail: '${url}' });
//       window.dispatchEvent(event);
//     `);
//     console.log('🚀 Event dispatched to the main window');
//   } else {
//     console.error('No main window found to dispatch the event');
//   }

//   // Close all other windows except the main window
//   allWindows.forEach((win) => {
//     if (win !== mainWindow) {
//       win.close();
//       console.log(`🚪 Closed window with ID: ${win.id}`);
//     }
//   });
// });
ipcRenderer.on('navigate-to-auth', (event, url) => {
  const customEvent = new CustomEvent('navigate-to-auth', { detail: url });
  console.log(
    '🚀 ~ ipcRenderer.on ~ navigate-to-auth ~ customEvent:',
    customEvent,
  );

  // Dispatch the event as a DOM event to the renderer window
  window.dispatchEvent(customEvent);
});
