// ########################
// ## 2. Docker Installer ##
// ########################

import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import { exec } from 'child_process';

export async function isDockerInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('docker --version', (error, stdout) => {
      if (error) {
        console.log('Docker not found:', error.message);
        resolve(false); // Docker is not installed
      } else {
        console.log('Docker version found:', stdout.trim());
        resolve(true); // Docker is installed
      }
    });
  });
}

export async function downloadDockerInstaller(
  url: string,
  filePath: string
): Promise<void> {
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, {
    responseType: 'stream',
    maxRedirects: 5,
  });

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

export async function installDocker(): Promise<string> {
  const isInstalled = await isDockerInstalled();
  if (isInstalled) {
    return 'Docker is already installed.';
  }

  const cpuArch = os.arch();
  const dockerUrls: { [key: string]: string } = {
    darwin_arm64: 'https://desktop.docker.com/mac/stable/arm64/Docker.dmg',
    darwin_x64: 'https://desktop.docker.com/mac/stable/Docker.dmg',
    win32:
      'https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe',
    linux:
      'https://desktop.docker.com/linux/main/amd64/docker-desktop-latest.deb',
  };

  const userPlatform = process.platform;
  const downloadKey = `${userPlatform}_${cpuArch}`;
  const url = dockerUrls[downloadKey] || dockerUrls[userPlatform];
  if (!url) {
    throw new Error('Unsupported platform or CPU architecture');
  }

  const installerPath = path.join(
    os.tmpdir(),
    `DockerInstaller${path.extname(url)}`
  );

  try {
    console.log(`Downloading Docker installer... ${url}`);
    await downloadDockerInstaller(url, installerPath);
    console.log('Download completed:', installerPath);
  } catch (downloadError) {
    throw new Error(`Failed to download Docker installer: ${downloadError}`);
  }

  if (userPlatform === 'darwin') {
    return new Promise((resolve, reject) => {
      exec(
        `hdiutil attach "${installerPath}" -nobrowse`,
        (attachError, stdout) => {
          if (attachError) {
            reject(new Error(`Failed to mount DMG: ${attachError.message}`));
            return;
          }

          const volumePathMatch = stdout
            .split('\n')
            .find((line) => line.includes('/Volumes/'));
          const volumePath = volumePathMatch
            ? volumePathMatch.trim().split('\t').pop()
            : null;

          if (!volumePath) {
            reject(new Error('Failed to determine mounted volume path.'));
            return;
          }

          exec(`open "${volumePath}"`, (openError) => {
            exec(`hdiutil detach "${volumePath}" -quiet`);
            if (openError) {
              reject(
                new Error(
                  `Failed to open Docker installer in Finder: ${openError.message}`
                )
              );
            } else {
              console.log(
                'Docker installer opened in Finder. Please drag Docker to /Applications.'
              );
              resolve(
                'Docker installer opened in Finder. Please drag Docker to /Applications.'
              );
            }
          });
        }
      );
    });
  } else {
    const launchCmd =
      userPlatform === 'win32'
        ? `start "" "${installerPath}"`
        : `chmod +x "${installerPath}" && sudo dpkg -i "${installerPath}"`;

    return new Promise((resolve, reject) => {
      exec(launchCmd, (error) => {
        if (error) {
          reject(new Error(`Failed to launch Docker installer: ${error}`));
        } else {
          resolve('Docker installer launched successfully.');
        }
      });
    });
  }
}
