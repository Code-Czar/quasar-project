import { app } from 'electron';
import fs from 'fs';

const resourcesPath = app.getPath('userData');

const logFile = fs.createWriteStream(`${resourcesPath}/app.log`, {
  flags: 'a',
});
export const logger = function (message: any) {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
  // if (!isProduction) {
  console.log(message);
  // }
};
