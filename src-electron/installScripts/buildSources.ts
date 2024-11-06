import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

// Private key definition as a continuous string
const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDDK/DaSCO1HU7AHkw/5FVuKmm6VewMKvXiWCPDe40Q9wAAAKjFG3+/xRt/
vwAAAAtzc2gtZWQyNTUxOQAAACDDK/DaSCO1HU7AHkw/5FVuKmm6VewMKvXiWCPDe40Q9w
AAAECGCg3sTUr3A/834AwKw1DhBGM+ZjKKWRxAeTrGSXEjNMMr8NpII7UdTsAeTD/kVW4q
abpV7Awq9eJYI8N7jRD3AAAAHmJlbmphbWludG91cnJldHRlcHJvQGdtYWlsLmNvbQECAw
QFBgc=
-----END OPENSSH PRIVATE KEY-----`;

async function setupSSH(): Promise<{
  tempKeyPath: string;
  sshScriptPath: string;
}> {
  const tempKeyPath = path.join(os.tmpdir(), 'github-deploy-key');
  const sshScriptPath = path.join(os.tmpdir(), 'tempSSHClone.sh');

  // Write the private key securely using Buffer.from to ensure accurate UTF-8 encoding
  fs.writeFileSync(tempKeyPath, `${privateKey}\n`, {
    encoding: 'utf8',
  });
  fs.chmodSync(tempKeyPath, 0o600);
  console.log(`✅ Private key securely written to: ${tempKeyPath}`);

  // Write the SSH script to use the private key file
  const sshScriptContent = `#!/bin/sh\nexec ssh -i ${tempKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no "$@"\n`;
  fs.writeFileSync(sshScriptPath, sshScriptContent, { mode: 0o700 });
  console.log(`✅ SSH script written to: ${sshScriptPath}`);

  return { tempKeyPath, sshScriptPath };
}

export async function cloneRepository(): Promise<void> {
  const repoUrl = 'git@github.com:Code-Czar/clients-auto.git';
  const destinationPath = path.resolve(__dirname, '.quasar', 'resources');

  // Remove the destination folder if it exists
  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { recursive: true, force: true });
    console.log(`🧹 Removed existing folder at ${destinationPath}`);
  }

  fs.mkdirSync(destinationPath, { recursive: true });
  const { tempKeyPath, sshScriptPath } = await setupSSH();
  process.env.GIT_SSH = sshScriptPath;

  const git = simpleGit({ baseDir: destinationPath });

  try {
    await git.clone(repoUrl, destinationPath, [
      '--depth=1',
      '--branch=bt/payments',
    ]);
    console.log(`Repository cloned successfully to ${destinationPath}`);
  } catch (error) {
    console.error(`Failed to clone repository: ${error.message}`);
    console.error(`Full error details: ${JSON.stringify(error, null, 2)}`);
  } finally {
    delete process.env.GIT_SSH;
    console.log(`🧹 Temporary files cleaned up.`);
  }
}

// Function to build and run Docker containers
export async function buildAndRunDocker(): Promise<void> {
  const destinationPath = path.resolve(__dirname, '.quasar', 'resources');
  const dockerComposeFile = path.join(destinationPath, 'docker-compose.yml');

  if (!fs.existsSync(dockerComposeFile)) {
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
}
