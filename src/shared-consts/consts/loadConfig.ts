import * as loadedConfig from './config.json';

export const REMOTE_URL = loadedConfig.REMOTE_URL;
export const LICENSE_SERVER_URL = loadedConfig.LICENSE_SERVER_URL;
export const REMOTE_WSS_URL = loadedConfig.REMOTE_WSS;
export const INFLUXDB_URL = loadedConfig.INFLUXDB_URL;
export const INFLUXDB_ORG = loadedConfig.INFLUXDB_ORG;
export const INFLUXDB_BUCKET = loadedConfig.INFLUXDB_BUCKET;
export const TELEGRAF_CLIENT = loadedConfig.TELEGRAF_CLIENT;
export const POSITION_MANAGER_API = loadedConfig.POSITION_MANAGER_API;
export const SUPABASE_URL = loadedConfig.SUPABASE_URL;
export const SUPABASE_KEY = loadedConfig.SUPABASE_KEY;
console.log('🚀 ~ SUPABASE_KEY:', SUPABASE_KEY);
console.log('🚀 ~ SUPABASE_URL:', SUPABASE_URL);
