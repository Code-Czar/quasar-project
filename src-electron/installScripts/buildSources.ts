// const simpleGit = require('simple-git');
const path_ = require('path');
const fs_ = require('fs');
const os_ = require('os');
const axios_ = require('axios');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
// const { Octokit } = require('@octokit/core');

// const { CENTRALIZATION_API_URLS } = require('src/shared-consts');

let isUpdating = false;

const LICENSE_SERVER_URL = 'https://beniben.hopto.org/user';
const GITHUB_TOKEN = `${LICENSE_SERVER_URL}/get-github-token`;

async function getGithubToken(productId: string) {
  try {
    const response = await axios_.get(`${GITHUB_TOKEN}/${productId}`);
    return response.data.github_token;
  } catch (error) {
    console.error('Failed to fetch GitHub token:', error);
    return null;
  }
}

async function checkForUpdates(productId: string, resourcesPath: string) {
  const repoOwner = 'Code-Czar';
  const repoName = 'clients-auto';

  const destinationPath = path_.normalize(
    path_.resolve(resourcesPath, '.quasar', 'resources'),
  );
  const localLatestFilePath = path_.normalize(
    path_.resolve(destinationPath, 'latest.yml'),
  );
  const tempFolderPath = path_.normalize(
    path_.resolve(destinationPath, 'tempFolder'),
  );

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
      },
    );

    const latestRelease = releaseResponse.data;
    const latestAsset = latestRelease.assets.find(
      (asset: { name: string }) => asset.name === 'latest.yml',
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
      },
    );

    const latestYmlContent = latestYmlResponse.data;

    // Check the local version and compare with the latest version
    let localYmlContent = null;
    // if (!(await fs_.exists(destinationPath))) {
    //   await fs_.mkdir(destinationPath, { recursive: true });
    // }
    if (!fs_.existsSync(destinationPath)) {
      // @ts-ignore
      fs_.mkdirSync(destinationPath, { recursive: true }, (err) => {
        if (err) {
          console.error('Failed to create directory:', err);
          return;
        }
        console.log('Directory created successfully');
      });
    }

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
      console.log(
        '🚀 ~ checkForUpdates ~ localLatestFilePath:',
        localLatestFilePath,
      );
      console.log('🚀 ~ checkForUpdates ~ latestYmlContent:', latestYmlContent);

      fs_.writeFileSync(
        path_.join(localLatestFilePath),
        latestYmlContent,
        'utf8',
      );
      return { shouldUpdate: true, latestVersion };
    }

    console.log('No update needed. You have the latest version:', localVersion);
    return { shouldUpdate: false, version: latestVersion };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { shouldUpdate: false };
  }
}

async function cloneRepository(productId: string, resourcesPath: string) {
  const destinationPath = resourcesPath;
  const tempFolderPath = path_.join(destinationPath, 'tempFolder');
  const zipFilePath = path_.join(tempFolderPath, 'repo.zip');
  // const downloadUrl =
  //   'https://github.com/Code-Czar/clients-auto/releases/latest/download/source-code.zip';

  const downloadUrl =
    'https://api.github.com/repos/Code-Czar/clients-auto/zipball/main';

  // Get GitHub Token
  const githubToken = await getGithubToken(productId);
  if (!githubToken) {
    console.error('Failed to retrieve a valid GitHub token.');
    return;
  }

  // Ensure the temp folder exists
  fs_.mkdirSync(tempFolderPath, { recursive: true });

  try {
    console.log(`Downloading repository from ${downloadUrl}...`);

    // Download the zip file using axios with authorization header
    const response = await axios_.get(downloadUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      responseType: 'arraybuffer', // Download as binary data
    });

    // Save the .zip file to the specified path
    fs_.writeFileSync(zipFilePath, response.data);
    console.log(`Repository downloaded to ${zipFilePath}. Extracting...`);

    // Extract the .zip file without creating the root folder
    const zip = new AdmZip(zipFilePath);
    // @ts-ignore
    zip.getEntries().forEach((entry) => {
      const entryPath = entry.entryName.split('/').slice(1).join('/'); // Remove the root folder name
      const fullPath = path_.join(tempFolderPath, entryPath);
      if (entry.isDirectory) {
        fs_.mkdirSync(fullPath, { recursive: true });
      } else {
        fs_.writeFileSync(fullPath, entry.getData());
      }
    });
    console.log(`Repository extracted successfully to ${tempFolderPath}`);
    return {
      type: 'install-status-update',
      status: `Repository extracted successfully to ${tempFolderPath}`,
      outputFolder: tempFolderPath,
    };

    // Build Docker containers from within tempFolder
    // const dockerComposeFile = path_.join(tempFolderPath, 'docker-compose.yml');
    // if (fs_.existsSync(dockerComposeFile)) {
    //   console.log(`🚀 Building Docker containers in ${tempFolderPath}`);
    //   execSync(`docker-compose -f "${dockerComposeFile}" up --build -d`, {
    //     stdio: 'inherit',
    //     cwd: tempFolderPath,
    //   });
    //   console.log(`✅ Docker containers built and running. (clone)`);
    //   return {
    //     type: 'install-status-update',
    //     status: `✅ Docker containers built and running.(clone)`,
    //   };
    // } else {
    //   console.error(`Docker Compose file not found at ${dockerComposeFile}`);
    // }
  } catch (error) {
    console.error(
      // @ts-ignore
      `Failed to download and build Docker containers: ${error.message}`,
    );
    return {
      type: 'install-status-update',
      status: `Clone repo failed: ${error}`,
    };
  } finally {
    console.log(`🧹 Cleaning up temporary folder.`);
    // fs.rmSync(tempFolderPath, { recursive: true, force: true });
  }
}

// async function downloadRepoContents(
//   owner: string,
//   repo: string,
//   path = '',
//   branch = 'main',
// ) {
//   try {
//     const response = await octokit.request(
//       'GET /repos/{owner}/{repo}/contents/{path}',
//       {
//         owner: owner,
//         repo: repo,
//         path: path,
//         headers: {
//           'X-GitHub-Api-Version': '2022-11-28',
//         },
//         ref: branch,
//       },
//     );

//     for (const item of response.data) {
//       if (item.type === 'file') {
//         await downloadFile(owner, repo, item.path);
//       } else if (item.type === 'dir') {
//         await downloadRepoContents(owner, repo, item.path, branch); // Recursively download directories
//       }
//     }
//   } catch (error) {
//     console.error(`Error fetching contents of ${path}:`, error);
//   }
// }

// // Function to download individual files
// async function downloadFile(owner, repo, filePath, branch = 'main') {
//   try {
//     const fileResponse = await octokit.request(
//       'GET /repos/{owner}/{repo}/contents/{path}',
//       {
//         owner: owner,
//         repo: repo,
//         path: filePath,
//         headers: {
//           'X-GitHub-Api-Version': '2022-11-28',
//           Accept: 'application/vnd.github.v3.raw', // Get raw file content
//         },
//         ref: branch,
//       },
//     );

//     console.log(`Downloaded ${filePath}:`, fileResponse.data);
//     // Here, fileResponse.data contains the file content in raw format
//   } catch (error) {
//     console.error(`Error downloading ${filePath}:`, error);
//   }
// }

async function buildAndRunDocker(resourcesPath: string) {
  const destinationPath = resourcesPath; //path_.resolve(__dirname, '.quasar', 'resources');
  const dockerComposeFile = path_.normalize(
    path_.join(destinationPath, 'tempFolder', 'docker-compose.yml'),
  );
  console.log('🚀 ~ buildAndRunDocker ~ dockerComposeFile:', dockerComposeFile);

  try {
    fs_.accessSync(dockerComposeFile, fs_.constants.F_OK);
  } catch (error) {
    console.error(
      `BUILDER : Docker Compose file not found at ${dockerComposeFile}`,
    );
    return;
  }

  try {
    console.log(`🚀 Building Docker containers in ${destinationPath}`);
    execSync(`docker-compose -f "${dockerComposeFile}" up --build -d`, {
      stdio: 'inherit',
      cwd: destinationPath,
    });
    console.log(`✅ Docker containers built and running.`);
    return {
      type: 'install-status-update',
      status: '✅ Docker containers built and running.',
    };
  } catch (error) {
    console.error(
      // @ts-ignore
      `Failed to build and run Docker containers: ${error.message}`,
    );
    return {
      type: 'install-status-update',
      status: `Failed to build and run Docker containers: ${error}`,
    };
  }
  isUpdating = false;
}
module.exports = {
  getGithubToken,
  cloneRepository,
  buildAndRunDocker,
  checkForUpdates,
};
