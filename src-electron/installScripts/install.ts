const { installDocker: installDocker_ } = require('./installDocker');
const {
  cloneRepository: cloneRepository_,
  buildAndRunDocker: buildAndRunDocker_,
} = require('./buildSources');
async function installDependencies(
  productId: string,
  resourcesPath: string,
  statusCallback: Function,
): Promise<{ success: boolean; message: string }> {
  try {
    // console.log('Checking and installing Docker if necessary...');
    console.log('!!!!Status');
    const dockerStatus = await installDocker_();
    statusCallback({ type: 'install-status-update', status: dockerStatus });
    console.log('!Status');
    console.log(dockerStatus);

    console.log('Cloning the repository...');
    statusCallback({
      type: 'install-status-update',
      status: 'Cloning the repository...',
    });
    const cloneStatus = await cloneRepository_(productId, resourcesPath);
    statusCallback({ type: 'install-status-update', status: cloneStatus });
    // console.log('Repository cloned successfully.');
    const buildStatus = await buildAndRunDocker_(resourcesPath);
    // console.log('Docker containers built successfully.');

    // @ts-ignore
    return {
      success: true,
      message: 'All dependencies installed successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error,
    };
  }
}

module.exports = { installDependencies };
