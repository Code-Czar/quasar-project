"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const resourcesPath = electron_1.app.getPath('userData');
const logFile = fs.createWriteStream(`${resourcesPath}/app.log`, {
    flags: 'a',
});
const logger = function (message) {
    logFile.write(`${new Date().toISOString()} - ${message}\n`);
    // if (!isProduction) {
    console.log(message);
    // }
};
