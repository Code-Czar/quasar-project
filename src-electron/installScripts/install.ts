const { installDocker: installDocker_ } = require('./installDocker');
const {
  cloneRepository: cloneRepository_,
  buildAndRunDocker: buildAndRunDocker_,
} = require('./buildSources');
async function installDependencies(
  productId: string,
  resourcesPath: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // console.log('Checking and installing Docker if necessary...');
    console.log('!!!!Status');
    const dockerStatus = await installDocker_();
    console.log('!Status');
    console.log(dockerStatus);

    console.log('Cloning the repository...');
    await cloneRepository_(productId, resourcesPath);
    // console.log('Repository cloned successfully.');
    // await buildAndRunDocker_(resourcesPath);
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
