/* @vite-ignore */
import { REMOTE_URL } from "../consts/loadConfig";

//Todo : move to config file
const CERTIFICAT_PATH = "/etc/letsencrypt/live/infinite-opportunities.pro";

// export let configureServer = null;

// if (typeof process !== 'undefined' && process.versions && process.versions.node) {
export const configureServer = async (expressApp) => {
  // const cors = (await import('cors')).default;
  // const bodyParser = (await import('body-parser')).default;
  // const compression = (await import('compression')).default;
  // const fs = (await import('fs')).default;
  // const http = (await import('http')).default;
  // const https = (await import('https')).default;
  // expressApp.use(bodyParser.json());
  // expressApp.use(compression());
  // expressApp.use(cors());
  // if (!REMOTE_URL.includes('localhost') && !REMOTE_URL.includes('127.0.0.1')) {
  //   // Use the paths from your Apache SSL configuration
  //   const privateKey = fs.readFileSync(`${CERTIFICAT_PATH}/privkey.pem`, 'utf8');
  //   const certificate = fs.readFileSync(`${CERTIFICAT_PATH}/fullchain.pem`, 'utf8');
  //   const credentials = { key: privateKey, cert: certificate };
  //   return { app: expressApp, server: https.createServer(credentials, expressApp) };
  // } else {
  //   return { app: expressApp, server: http.createServer(expressApp) };
  // }
};
// }
