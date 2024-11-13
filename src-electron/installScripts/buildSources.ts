const simpleGit = require('simple-git');
const path_ = require('path');
const fs_ = require('fs');
const os_ = require('os');
const axios_ = require('axios');
const { execSync } = require('child_process');

let isUpdating = false;
async function getGithubToken(productId) {
  try {
    const response = await axios_.get(
      `http://localhost:8000/get-github-token/${productId}`
    );
    return response.data.github_token;
  } catch (error) {
    console.error('Failed to fetch GitHub token:', error);
    return null;
  }
}

async function setupSSH(productId) {
  const privateKey = await getGithubToken(productId);
  if (!privateKey) {
    console.error('Private key is missing');
    return null;
  }

  const tempKeyPath = path_.join(os_.tmpdir(), 'github-deploy-key');

  fs_.writeFileSync(tempKeyPath, `${privateKey}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });

  console.log(`✅ Private key securely written to: ${tempKeyPath}`);

  return `ssh -i ${tempKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no`;
}

async function checkForUpdates(productId) {
  const repoOwner = 'Code-Czar';
  const repoName = 'clients-auto';
  const destinationPath = path_.resolve(__dirname, '.quasar', 'resources');
  const localLatestFilePath = path_.join(destinationPath, 'latest.yml');
  const tempFolderPath = path_.join(destinationPath, 'tempFolder');

  // Abort if tempFolder already exists (to prevent infinite loop)
  if (fs_.existsSync(tempFolderPath)) {
    console.warn('Update process aborted: tempFolder already exists.');
    return { shouldUpdate: false };
  }

  const githubToken = await getGithubToken(productId);
  console.log('🚀 ~ checkForUpdates ~ githubToken:', githubToken);
  if (!githubToken) {
    console.error('Failed to retrieve a valid GitHub token.');
    return { shouldUpdate: false };
  }

  try {
    // Fetch the latest release data
    const releaseResponse = await axios_.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const latestRelease = releaseResponse.data;
    const latestAsset = latestRelease.assets.find(
      (asset) => asset.name === 'latest.yml'
    );

    if (!latestAsset) {
      console.error('No latest.yml found in the latest release');
      return { shouldUpdate: false };
    }

    // Download the latest.yml file to the destination path if update is required
    const latestYmlResponse = await axios_.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/assets/${latestAsset.id}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/octet-stream',
        },
      }
    );

    const latestYmlContent = latestYmlResponse.data;

    // Check the local version and compare with the latest version
    let localYmlContent = null;
    if (fs_.existsSync(localLatestFilePath)) {
      localYmlContent = fs_.readFileSync(localLatestFilePath, 'utf8');
    }

    const latestVersion = /version:\s*(.*)/.exec(latestYmlContent)?.[1];
    const localVersion = localYmlContent
      ? /version:\s*(.*)/.exec(localYmlContent)?.[1]
      : null;

    if (!localVersion || latestVersion !== localVersion) {
      console.log('Update available:', latestVersion);

      // Save the latest.yml content to the destination path
      fs_.writeFileSync(localLatestFilePath, latestYmlContent, 'utf8');
      return { shouldUpdate: true, latestVersion };
    }

    console.log('No update needed. You have the latest version:', localVersion);
    return { shouldUpdate: false };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { shouldUpdate: false };
  }
}

async function cloneRepository(productId) {
  const destinationPath = path_.resolve(__dirname, '.quasar', 'resources');
  const tempFolderPath = path_.join(destinationPath, 'tempFolder');

  // Abort if tempFolder already exists (to prevent infinite loop)
  if (fs_.existsSync(tempFolderPath)) {
    console.warn('Update process aborted: tempFolder already exists.');
    return;
  }

  // Get GitHub Token
  const githubToken = await getGithubToken(productId);
  if (!githubToken) {
    console.error('Failed to retrieve a valid GitHub token.');
    return;
  }

  // Create temp folder
  fs_.mkdirSync(tempFolderPath, { recursive: true });

  // Construct the HTTPS URL with the GitHub token
  const repoUrl = `https://${githubToken}@github.com/Code-Czar/clients-auto.git`;
  const git = simpleGit({ baseDir: tempFolderPath });

  try {
    // Clone into the temporary directory
    await git.clone(repoUrl, tempFolderPath, ['--depth=1']);
    console.log(`Repository cloned successfully to ${tempFolderPath}`);

    // Build Docker containers from within tempFolder
    const dockerComposeFile = path_.join(tempFolderPath, 'docker-compose.yml');
    if (fs_.existsSync(dockerComposeFile)) {
      console.log(`🚀 Building Docker containers in ${tempFolderPath}`);
      execSync(`docker-compose -f ${dockerComposeFile} up --build -d`, {
        stdio: 'inherit',
        cwd: tempFolderPath,
      });
      console.log(`✅ Docker containers built and running.`);
    } else {
      console.error(`Docker Compose file not found at ${dockerComposeFile}`);
    }
  } catch (error) {
    console.error(
      `Failed to clone and build Docker containers: ${error.message}`
    );
  } finally {
    // Clean up temporary folder
    if (fs_.existsSync(tempFolderPath)) {
      fs_.rmSync(tempFolderPath, { recursive: true, force: true });
    }
    console.log(`🧹 Temporary folder cleaned up.`);
  }
}

async function buildAndRunDocker() {
  const destinationPath = path_.resolve(__dirname, '.quasar', 'resources');
  const dockerComposeFile = path_.join(destinationPath, 'docker-compose.yml');

  if (!fs_.existsSync(dockerComposeFile)) {
    console.error(`Docker Compose file not found at ${dockerComposeFile}`);
    return;
  }

  try {
    console.log(`🚀 Building Docker containers in ${destinationPath}`);
    execSync(`docker-compose -f ${dockerComposeFile} up --build -d`, {
      stdio: 'inherit',
      cwd: destinationPath,
    });
    console.log(`✅ Docker containers built and running.`);
  } catch (error) {
    console.error(
      `Failed to build and run Docker containers: ${error.message}`
    );
  }
  isUpdating = false;
}
module.exports = {
  getGithubToken,
  setupSSH,
  cloneRepository,
  buildAndRunDocker,
  checkForUpdates,
};
