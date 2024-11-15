const { installDependencies: installDependencies_ } = require('./install');
const { parentPort, workerData } = require('worker_threads');

function statusCallback(result) {
  parentPort.postMessage(result);
}

const install = async (productId: string) => {
  try {
    const result = await installDependencies_(
      productId,
      resourcesPath,
      statusCallback,
    );
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage!({ error: error.message });
  } finally {
  }
};
const { productId, resourcesPath } = workerData;
install(productId);
