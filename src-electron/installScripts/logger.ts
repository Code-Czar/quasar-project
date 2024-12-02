import { app, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize paths
let resourcesPath: string;
let logFilePath: string;

try {
  resourcesPath = app.getPath('userData'); // Check if userData path is available
  logFilePath = path.join(resourcesPath, 'app.log');
} catch (error: any) {
  console.error('Error accessing userData path:', error.message);
  // Fallback to temp directory if userData is not accessible
  resourcesPath = os.tmpdir();
  logFilePath = path.join(resourcesPath, 'preload.log');
  log(`Falling back to temp directory for logging: ${logFilePath}`);
}

// Ensure the log file exists
if (!fs.existsSync(logFilePath)) {
  try {
    fs.writeFileSync(logFilePath, 'Log file initialized.\n', { flag: 'w' });
  } catch (error: any) {
    console.error('Failed to create log file:', error.message);
  }
}

// Create a write stream for logging
const logFile = fs.createWriteStream(logFilePath, {
  flags: 'a', // Append mode
});

/**
 * Logs a message to both the console and the log file.
 */
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(logFilePath, logMessage); // Write to log file
  } catch (error: any) {
    console.error('Failed to write to log file:', error.message);
  }

  console.log(logMessage.trim()); // Always log to the console
}

/**
 * Logs a message using a write stream and console.
 */
export const logger = function (message: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;

  try {
    logFile.write(logMessage); // Write to the log stream
  } catch (error: any) {
    console.error('Error writing to log stream:', error.message);
  }

  log(logMessage.trim()); // Always log to the console
  log(message); // Ensure fallback logs to a file
};

// /**
//  * Logs a message to the debug window if available.
//  */
// export function logToDebugWindow(message: string) {
//   const timestamp = new Date().toISOString();
//   const debugMessage = `[${timestamp}] ${message}`;

//   log(debugMessage); // Always log to the console

//   if (typeof debugWindow !== 'undefined' && debugWindow.webContents) {
//     debugWindow.webContents.send('message', debugMessage);
//   } else {
//     console.warn('Debug window is not defined.');
//   }
// }

/**
 * Opens the log file and its parent folder in the file explorer.
 */
function openLogFileAndFolder() {
  try {
    log(`Opening log file: ${logFilePath}`);
    shell.openPath(logFilePath); // Opens the log file in the default editor

    const logFolder = path.dirname(logFilePath);
    log(`Opening log folder: ${logFolder}`);
    shell.openPath(logFolder); // Opens the parent folder in the file explorer
  } catch (error: any) {
    console.error('Error opening log file or folder:', error.message);
  }
}

// // Auto-open log file and folder on app startup in production
// app.on('ready', () => {
//   if (app.isPackaged) {

//   }
//   log('Application ready.');
// });

// openLogFileAndFolder();
// Example usage
log('Preload script started.');
log(`Log file is located at: ${logFilePath}`);
