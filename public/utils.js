"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractZip = exports.delay = exports.logger = exports.isDevMode = void 0;
// import fs from 'fs';
const electron_1 = require("electron");
const fs_extra_1 = __importDefault(require("fs-extra"));
// @ts-ignore
const node_unzip_2_1 = __importDefault(require("node-unzip-2"));
const path_1 = __importDefault(require("path"));
exports.isDevMode = !electron_1.app.isPackaged || process.env.NODE_ENV === 'development';
const resourcesPath = electron_1.app.getPath('userData');
const logFile = fs_extra_1.default.createWriteStream(`${resourcesPath}/app.log`, {
    flags: 'a',
});
const logger = function (message) {
    logFile.write(`${new Date().toISOString()} - ${message}\n`);
    // if (!isProduction) {
    console.log(message);
    // }
};
exports.logger = logger;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
// @ts-ignore
const extractZip = (zipFilePath, outputDir) => {
    return new Promise((resolve, reject) => {
        // Create output directory if it doesn't exist
        if (!fs_extra_1.default.existsSync(outputDir)) {
            fs_extra_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const unzipStream = fs_extra_1.default
            .createReadStream(zipFilePath)
            .pipe(node_unzip_2_1.default.Parse())
            // @ts-ignore
            .on('entry', function (entry) {
            const fileName = entry.path;
            const type = entry.type;
            // If it's an .asar file, save it directly without trying to extract
            if (path_1.default.extname(fileName) === '.asar') {
                const outputPath = path_1.default.join(outputDir, fileName);
                // Ensure the directory exists
                const dirname = path_1.default.dirname(outputPath);
                if (!fs_extra_1.default.existsSync(dirname)) {
                    fs_extra_1.default.mkdirSync(dirname, { recursive: true });
                }
                entry.pipe(fs_extra_1.default.createWriteStream(outputPath));
            }
            else if (type === 'Directory') {
                // Create directory
                const dirPath = path_1.default.join(outputDir, fileName);
                if (!fs_extra_1.default.existsSync(dirPath)) {
                    fs_extra_1.default.mkdirSync(dirPath, { recursive: true });
                }
                entry.autodrain();
            }
            else {
                // Regular file
                const outputPath = path_1.default.join(outputDir, fileName);
                // Ensure the directory exists
                const dirname = path_1.default.dirname(outputPath);
                if (!fs_extra_1.default.existsSync(dirname)) {
                    fs_extra_1.default.mkdirSync(dirname, { recursive: true });
                }
                entry.pipe(fs_extra_1.default.createWriteStream(outputPath));
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
exports.extractZip = extractZip;
