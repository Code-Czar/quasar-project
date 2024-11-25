import { Worker } from 'worker_threads';
import { app, path } from 'electron';

export const spawnWorker = (scriptName, args = {}, callback = null) => {
  return new Promise((resolve, reject) => {
    const basePath = app.isPackaged
      ? app.getAppPath()
      : path.resolve(__dirname, '../../src-electron');
    const scriptPath = path.join(
      basePath,
      'installScripts',
      `${scriptName}.${app.isPackaged ? 'js' : 'ts'}`,
    );

    const worker = new Worker(scriptPath, {
      workerData: { ...args, resourcesPath: app.getPath('userData') },
      execArgv: app.isPackaged ? [] : ['-r', 'ts-node/register/transpile-only'],
    });

    worker.on('message', (result) => {
      if (result.success || result.shouldUpdate !== null) {
        resolve(result);
      } else if (result.success === false) {
        reject(new Error(`Failed to parse worker result: ${result}`));
      } else {
        callback?.(result);
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};
