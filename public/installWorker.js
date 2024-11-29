"use strict";
const { installDependencies: installDependencies_ } = require('./install');
const { parentPort, workerData } = require('worker_threads');
// @ts-ignore
function statusCallback(result) {
    parentPort.postMessage(result);
}
const install = async (productId) => {
    try {
        const result = await installDependencies_(productId, resourcesPath, statusCallback);
        parentPort.postMessage(result);
    }
    catch (error) {
        // @ts-ignore
        parentPort.postMessage({ error: error.message });
    }
    finally {
    }
};
const { productId, resourcesPath } = workerData;
install(productId);
