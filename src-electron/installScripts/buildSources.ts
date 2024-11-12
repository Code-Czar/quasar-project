import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import { execSync } from 'child_process';

async function getGithubToken(productId: string): Promise<string | null> {
  try {
    const response = await axios.get(
      `http://localhost:8000/get-github-token/${productId}`
    );
    return response.data.github_token;
  } catch (error) {
    console.error('Failed to fetch GitHub token:', error);
    return null;
  }
}

async function setupSSH(productId: string): Promise<string | null> {
  // Get the GitHub deploy key for the specific product
  const privateKey = await getGithubToken(productId);
  if (!privateKey) {
    console.error('Private key is missing');
    return null;
  }

  const tempKeyPath = path.join(os.tmpdir(), 'github-deploy-key');

  // Write the private key securely
  fs.writeFileSync(tempKeyPath, `${privateKey}`, {
    encoding: 'utf8',
    mode: 0o777, // Only the owner can read/write
  });

  console.log(`✅ Private key securely written to: ${tempKeyPath}`);

  // Set the `GIT_SSH_COMMAND` to use this specific key
  return `ssh -i ${tempKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no`;
}

export async function cloneRepository(productId: string): Promise<void> {
  const repoUrl = 'git@github.com-Code-Czar:Code-Czar/clients-auto.git';
  const destinationPath = path.resolve(__dirname, '.quasar', 'resources');

  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { recursive: true, force: true });
    console.log(`🧹 Removed existing folder at ${destinationPath}`);
  }

  fs.mkdirSync(destinationPath, { recursive: true });

  // Set up SSH with the fetched private key
  const gitSSHCommand = await setupSSH(productId);
  console.log('🚀 ~ cloneRepository ~ gitSSHCommand:', gitSSHCommand);
  if (!gitSSHCommand) {
    console.error('Failed to set up SSH');
    return;
  }

  // Configure environment variable for SSH key usage
  process.env.GIT_SSH_COMMAND = gitSSHCommand;

  const git = simpleGit({ baseDir: destinationPath });

  try {
    await git.clone(repoUrl, destinationPath, ['--depth=1']);
    console.log(`Repository cloned successfully to ${destinationPath}`);
  } catch (error) {
    console.error(`Failed to clone repository: ${error.message}`);
  } finally {
    delete process.env.GIT_SSH_COMMAND; // Clean up the environment variable
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
