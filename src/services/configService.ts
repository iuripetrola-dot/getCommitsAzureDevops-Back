import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { getAppConfig } from '../config/appConfig';
import { ConfiguredAuthor, RepositoryTarget, RootConfigFile, ShellConfig } from '../types/azureDevops';

function normalizeRepositories(value: unknown[]): RepositoryTarget[] {
  return value
    .map((item) => ({
      project: String((item as RepositoryTarget | undefined)?.project ?? '').trim(),
      repo: String((item as RepositoryTarget | undefined)?.repo ?? '').trim()
    }))
    .filter((item) => item.project && item.repo);
}

function normalizeAuthors(authorEmailsValue: unknown, authorsValue: unknown): ConfiguredAuthor[] {
  const sourceValues: unknown[] = [];

  if (Array.isArray(authorsValue)) {
    sourceValues.push(...authorsValue);
  }

  if (Array.isArray(authorEmailsValue)) {
    sourceValues.push(...authorEmailsValue);
  }

  const uniqueAuthors = new Map<string, ConfiguredAuthor>();

  for (const value of sourceValues) {
    if (typeof value === 'string') {
      const email = value.trim();

      if (!email) {
        continue;
      }

      const key = email.toLowerCase();
      uniqueAuthors.set(key, {
        name: uniqueAuthors.get(key)?.name || '',
        email
      });
      continue;
    }

    if (!value || typeof value !== 'object') {
      continue;
    }

    const email = String((value as Partial<ConfiguredAuthor>).email ?? '').trim();
    const name = String((value as Partial<ConfiguredAuthor>).name ?? '').trim();

    if (!email) {
      continue;
    }

    uniqueAuthors.set(email.toLowerCase(), { name, email });
  }

  return Array.from(uniqueAuthors.values());
}

function resolveOptionalPath(baseFile: string, targetPath: unknown): string {
  const normalized = String(targetPath ?? '').trim();

  if (!normalized) {
    return '';
  }

  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  return path.resolve(path.dirname(baseFile), normalized);
}

export async function loadRootConfig(): Promise<RootConfigFile> {
  const { configFile } = getAppConfig();

  if (!existsSync(configFile)) {
    throw new Error(`Arquivo de configuracao nao encontrado em ${configFile}.`);
  }

  const content = await readFile(configFile, 'utf-8');
  const parsed = JSON.parse(content) as Partial<RootConfigFile>;
  const server = parsed.server ?? ({} as RootConfigFile['server']);
  const azureDevops = parsed.azureDevops ?? ({} as RootConfigFile['azureDevops']);
  const authors = normalizeAuthors(azureDevops.authorEmails, azureDevops.authors);

  return {
    server: {
      port: Number(server.port || 3000),
      corsOrigin: server.corsOrigin ?? '*'
    },
    azureDevops: {
      base64AuthInfo: String(azureDevops.base64AuthInfo || '').trim(),
      orgUrl: String(azureDevops.orgUrl || 'https://devops.caixa/projetos').replace(/\/$/, ''),
      daysAgo: Number(azureDevops.daysAgo || 1),
      insecureTls: Boolean(azureDevops.insecureTls),
      caCertPath: resolveOptionalPath(configFile, azureDevops.caCertPath),
      authors,
      authorEmails: authors.map((author) => author.email),
      repositories: Array.isArray(azureDevops.repositories)
        ? normalizeRepositories(azureDevops.repositories)
        : []
    }
  };
}

export async function loadShellConfig(): Promise<ShellConfig> {
  const rootConfig = await loadRootConfig();

  return {
    orgUrl: rootConfig.azureDevops.orgUrl,
    daysAgo: rootConfig.azureDevops.daysAgo,
    insecureTls: rootConfig.azureDevops.insecureTls,
    caCertPath: rootConfig.azureDevops.caCertPath,
    authors: rootConfig.azureDevops.authors,
    authorEmails: rootConfig.azureDevops.authorEmails,
    repositories: rootConfig.azureDevops.repositories
  };
}
