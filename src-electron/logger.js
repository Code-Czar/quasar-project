import { app } from 'electron';

const resourcesPath = app.getPath('userData');

const logFile = fs.createWriteStream(`${resourcesPath}/app.log`, {
  flags: 'a',
});
const logger = function (message) {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
  // if (!isProduction) {
  console.log(message);
  // }
};
