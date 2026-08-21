import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { getAppConfig } from '../config/appConfig';
import { CollectCommitsResult } from './commitService';

let lastCommitsResult: CollectCommitsResult | null = null;

export async function saveLastCommitsResult(result: CollectCommitsResult): Promise<void> {
  lastCommitsResult = result;
  const { lastCommitsCacheFile } = getAppConfig();

  await mkdir(path.dirname(lastCommitsCacheFile), { recursive: true });
  await writeFile(lastCommitsCacheFile, JSON.stringify(result, null, 2), 'utf-8');
}

export async function getLastCommitsResult(): Promise<CollectCommitsResult | null> {
  if (lastCommitsResult) {
    return lastCommitsResult;
  }

  const { lastCommitsCacheFile } = getAppConfig();

  if (!existsSync(lastCommitsCacheFile)) {
    return null;
  }

  const content = await readFile(lastCommitsCacheFile, 'utf-8');
  const parsed = JSON.parse(content) as CollectCommitsResult;
  lastCommitsResult = parsed;
  return lastCommitsResult;
}
