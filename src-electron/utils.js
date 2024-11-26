// import fs from 'fs';
import { app } from 'electron';
import fs from 'fs-extra';

import unzip from 'node-unzip-2';
import path from 'path';

export const isDevMode =
  !app.isPackaged || process.env.NODE_ENV === 'development';
const resourcesPath = app.getPath('userData');
const logFile = fs.createWriteStream(`${resourcesPath}/app.log`, {
  flags: 'a',
});

export const logger = function (message) {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
  // if (!isProduction) {
  console.log(message);
  // }
};
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractZip = (zipFilePath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const unzipStream = fs
      .createReadStream(zipFilePath)
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path;
        const type = entry.type;

        // If it's an .asar file, save it directly without trying to extract
        if (path.extname(fileName) === '.asar') {
          const outputPath = path.join(outputDir, fileName);
          // Ensure the directory exists
          const dirname = path.dirname(outputPath);
          if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
          }
          entry.pipe(fs.createWriteStream(outputPath));
        } else if (type === 'Directory') {
          // Create directory
          const dirPath = path.join(outputDir, fileName);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          entry.autodrain();
        } else {
          // Regular file
          const outputPath = path.join(outputDir, fileName);
          // Ensure the directory exists
          const dirname = path.dirname(outputPath);
          if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
          }
          entry.pipe(fs.createWriteStream(outputPath));
        }
      });

    unzipStream.on('close', () => {
      resolve(outputDir);
    });

    unzipStream.on('error', (error) => {
      console.error('Error extracting ZIP file:', error.message);
      reject(error);
    });
  });
};
