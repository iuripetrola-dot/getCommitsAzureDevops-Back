import path from 'node:path';

export interface AppConfig {
  configFile: string;
  lastCommitsCacheFile: string;
}

export function getAppConfig(): AppConfig {
  return {
    configFile: path.resolve(process.cwd(), process.env.APP_CONFIG_FILE || '../config.json'),
    lastCommitsCacheFile: path.resolve(
      process.cwd(),
      process.env.APP_LAST_COMMITS_CACHE_FILE || './data/last-commits-result.json'
    )
  };
}
