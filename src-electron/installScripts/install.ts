const { installDocker: installDocker_ } = require('./installDocker');
const {
  cloneRepository: cloneRepository_,
  buildAndRunDocker: buildAndRunDocker_,
} = require('./buildSources');
async function installDependencies(
  productId: string,
  resourcesPath: string,
): Promise<string> {
  try {
    console.log('Checking and installing Docker if necessary...');
    const dockerStatus = await installDocker_();
    console.log(dockerStatus);

    console.log('Cloning the repository...');
    await cloneRepository_(productId, resourcesPath);
    console.log('Repository cloned successfully.');
    await buildAndRunDocker_(resourcesPath);
    console.log('Docker containers built successfully.');

    // @ts-ignore
    return {
      success: true,
      message: 'All dependencies installed successfully.',
    };
  } catch (error) {
    throw new Error(
      `Dependency installation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

module.exports = { installDependencies };
