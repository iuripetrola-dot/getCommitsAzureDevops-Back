import { getAppConfig } from '../config/appConfig';
import { AzureBranchRef, AzureGitCommit, AzureListResponse, CommitResult } from '../types/azureDevops';
import { formatDisplayDate } from '../utils/dateUtils';
import { httpGetJson } from './azureDevopsHttpService';
import { loadRootConfig, loadShellConfig } from './configService';

export interface CollectCommitsResult {
  startedAt: string;
  finishedAt: string;
  generatedAt: string;
  config: {
    orgUrl: string;
    daysAgo: number;
    repositories: { project: string; repo: string }[];
    authors: { name: string; email: string }[];
    authorEmails: string[];
  };
  totalCommits: number;
  logs: string[];
  commits: CommitResult[];
}

export type CommitCollectionLogListener = (line: string) => void;

function appendLog(logs: string[], message: string, onLog?: CommitCollectionLogListener): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  logs.push(line);
  onLog?.(line);
}

function isFUser(authorName: string): boolean {
  return authorName.trim().toLowerCase().startsWith('f');
}

export async function collectCommits(
  daysAgoOverride?: number,
  onLog?: CommitCollectionLogListener
): Promise<CollectCommitsResult> {
  const startedAt = new Date().toISOString();
  const appConfig = getAppConfig();
  const rootConfig = await loadRootConfig();

  if (!rootConfig.azureDevops.base64AuthInfo.trim()) {
    throw new Error(`Defina azureDevops.base64AuthInfo no arquivo ${appConfig.configFile}.`);
  }

  const shellConfig = await loadShellConfig();
  const daysAgo = Number(daysAgoOverride || shellConfig.daysAgo || 1);
  const fromDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const logs: string[] = [];
  const commits: Array<CommitResult & { timestamp: number }> = [];
  const seen = new Set<string>();
  let ignoredCommits = 0;
  const headers = {
    Authorization: `Basic ${rootConfig.azureDevops.base64AuthInfo.trim()}`,
    Accept: 'application/json'
  };

  appendLog(logs, 'Coleta iniciada.', onLog);

  for (let repoIndex = 0; repoIndex < shellConfig.repositories.length; repoIndex += 1) {
    const target = shellConfig.repositories[repoIndex];
    appendLog(logs, `[${repoIndex + 1}/${shellConfig.repositories.length}] Coletando branches de ${target.repo}...`, onLog);

    const branchesUrl = `${shellConfig.orgUrl}/${encodeURIComponent(target.project)}/_apis/git/repositories/${encodeURIComponent(target.repo)}/refs?filter=heads/&api-version=7.1`;
    const branchesResponse = await httpGetJson<AzureListResponse<AzureBranchRef>>(
      branchesUrl,
      headers,
      shellConfig.insecureTls,
      shellConfig.caCertPath
    );
    const branches = Array.isArray(branchesResponse.value)
      ? branchesResponse.value.map((branch) => branch.name).filter(Boolean)
      : [];

    if (!branches.length) {
      appendLog(logs, `Nenhuma branch encontrada para ${target.repo}.`, onLog);
      continue;
    }

    appendLog(logs, `${target.repo}: ${branches.length} branch(es) encontradas.`, onLog);

    for (let branchIndex = 0; branchIndex < branches.length; branchIndex += 1) {
      const branchName = String(branches[branchIndex]).replace(/^refs\/heads\//, '');

      for (let authorIndex = 0; authorIndex < shellConfig.authorEmails.length; authorIndex += 1) {
        const authorEmail = shellConfig.authorEmails[authorIndex];
        appendLog(
          logs,
          `[${repoIndex + 1}/${shellConfig.repositories.length}] ${target.repo} | branch ${branchIndex + 1}/${branches.length} | autor ${authorIndex + 1}/${shellConfig.authorEmails.length}`,
          onLog
        );

        const commitsUrl =
          `${shellConfig.orgUrl}/${encodeURIComponent(target.project)}/_apis/git/repositories/${encodeURIComponent(target.repo)}/commits` +
          `?searchCriteria.author=${encodeURIComponent(authorEmail)}` +
          `&searchCriteria.fromDate=${encodeURIComponent(fromDate)}` +
          `&searchCriteria.itemVersion.version=${encodeURIComponent(branchName)}` +
          `&api-version=7.1`;

        const commitsResponse = await httpGetJson<AzureListResponse<AzureGitCommit>>(
          commitsUrl,
          headers,
          shellConfig.insecureTls,
          shellConfig.caCertPath
        );
        const currentCommits = Array.isArray(commitsResponse.value) ? commitsResponse.value : [];

        if (currentCommits.length > 0) {
          appendLog(logs, `${target.repo} | ${branchName} | ${authorEmail}: ${currentCommits.length} commit(s).`, onLog);
        }

        for (const commit of currentCommits) {
          const commitAuthorName = String(commit.author?.name || '').trim();
          if (!isFUser(commitAuthorName)) {
            ignoredCommits += 1;
            continue;
          }

          const uniqueKey = `${commit.commitId}|${branchName}|${authorEmail.toLowerCase()}`;
          if (seen.has(uniqueKey)) {
            continue;
          }
          seen.add(uniqueKey);

          const parsedDate = commit.author?.date ? new Date(commit.author.date) : null;
          const safeDate = parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
          const commitAuthorEmail = String(commit.author?.email || authorEmail).trim();

          commits.push({
            id: `${commit.commitId || 'row'}-${branchName}-${commits.length}`,
            author: commitAuthorName,
            email: commitAuthorEmail,
            repository: target.repo,
            branch: branchName,
            rawDate: safeDate ? formatDisplayDate(safeDate) : '',
            message: String(commit.comment || '').replace(/\r?\n/g, ' ').trim(),
            commitId: String(commit.commitId || ''),
            date: safeDate ? safeDate.toISOString() : null,
            timestamp: safeDate ? safeDate.getTime() : 0
          });
        }
      }
    }
  }

  commits.sort((left, right) => right.timestamp - left.timestamp);
  if (ignoredCommits > 0) {
    appendLog(logs, `${ignoredCommits} commit(s) descartado(s): nome do autor nao inicia com "f".`, onLog);
  }
  appendLog(logs, `Coleta concluida com ${commits.length} commit(s).`, onLog);
  const finishedAt = new Date().toISOString();
  appendLog(logs, 'Coleta finalizada.', onLog);

  return {
    startedAt,
    finishedAt,
    generatedAt: new Date().toISOString(),
    config: {
      orgUrl: shellConfig.orgUrl,
      daysAgo,
      repositories: shellConfig.repositories,
      authors: shellConfig.authors,
      authorEmails: shellConfig.authorEmails
    },
    totalCommits: commits.length,
    logs,
    commits: commits.map(({ timestamp: _timestamp, ...commit }) => commit)
  };
}
