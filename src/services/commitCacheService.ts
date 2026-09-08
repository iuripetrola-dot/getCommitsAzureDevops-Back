import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getAppConfig } from '../config/appConfig';
import { CollectCommitsResult } from './commitService';

export async function saveLastCommitsResult(result: CollectCommitsResult): Promise<void> {
  const { lastCommitsCacheFile } = getAppConfig();

  await mkdir(path.dirname(lastCommitsCacheFile), { recursive: true });
  await writeFile(lastCommitsCacheFile, JSON.stringify(result, null, 2), 'utf-8');
}

export async function getLastCommitsResult(): Promise<CollectCommitsResult | null> {
  const { lastCommitsCacheFile } = getAppConfig();

  try {
    const content = await readFile(lastCommitsCacheFile, 'utf-8');
    return JSON.parse(content) as CollectCommitsResult;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}
