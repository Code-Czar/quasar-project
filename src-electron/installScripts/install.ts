const { installDocker } = require('./installDocker');
const { cloneRepository, buildAndRunDocker } = require('./buildSources');
async function installDependencies(productId: string): Promise<string> {
  try {
    console.log('Checking and installing Docker if necessary...');
    const dockerStatus = await installDocker();
    console.log(dockerStatus);

    console.log('Cloning the repository...');
    await cloneRepository(productId);
    console.log('Repository cloned successfully.');
    await buildAndRunDocker();
    console.log('Docker containers built successfully.');

    return 'All dependencies installed successfully.';
  } catch (error) {
    throw new Error(
      `Dependency installation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

module.exports = { installDependencies };
