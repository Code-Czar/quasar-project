const { installDependencies: installDependencies_ } = require('./install');
const { parentPort, workerData } = require('worker_threads');

const install = async (productId: string) => {
  try {
    console.log('🚀 ~ process.on ~ installer:', installDependencies_);
    const result = await installDependencies_(productId, resourcesPath);
    parentPort.postMessage(result);

    // process.send!(result);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ingore error type
    process.send!({ error: error.message });
  } finally {
    process.exit();
  }
};
const { productId, resourcesPath } = workerData;
install(productId);
