import { getAppConfig } from '../config/appConfig';
import { AzureGitPullRequest, AzureListResponse, PullRequestResult } from '../types/azureDevops';
import { httpGetJson } from './azureDevopsHttpService';
import { loadRootConfig, loadShellConfig } from './configService';

const PAGE_SIZE = 100;

function normalizeBranch(branch: string | undefined): string {
  return String(branch || '').replace(/^refs\/heads\//, '');
}

function normalizeReviewer(reviewer: AzureGitPullRequest['createdBy']): string {
  const name = String(reviewer?.displayName || '').trim();
  const email = String(reviewer?.uniqueName || '').trim();

  if (name && email && name.toLowerCase() !== email.toLowerCase()) {
    return `${name} - ${email}`;
  }

  return name || email;
}

function buildPullRequestUrl(
  orgUrl: string,
  project: string,
  repository: string,
  pullRequest: AzureGitPullRequest
): string {
  const webUrl = String(pullRequest._links?.web?.href || '').trim();
  if (webUrl) {
    return webUrl;
  }

  const pullRequestId = Number(pullRequest.pullRequestId || 0);
  if (!pullRequestId) {
    return '';
  }

  return `${orgUrl}/${encodeURIComponent(project)}/_git/${encodeURIComponent(repository)}/pullrequest/${pullRequestId}`;
}

export async function collectOpenPullRequests(): Promise<PullRequestResult[]> {
  const appConfig = getAppConfig();
  const rootConfig = await loadRootConfig();

  if (!rootConfig.azureDevops.base64AuthInfo.trim()) {
    throw new Error(`Defina azureDevops.base64AuthInfo no arquivo ${appConfig.configFile}.`);
  }

  const config = await loadShellConfig();
  const headers = {
    Authorization: `Basic ${rootConfig.azureDevops.base64AuthInfo.trim()}`,
    Accept: 'application/json'
  };
  const pullRequests: PullRequestResult[] = [];

  for (const target of config.repositories) {
    let skip = 0;

    while (true) {
      const pullRequestsUrl =
        `${config.orgUrl}/${encodeURIComponent(target.project)}/_apis/git/repositories/${encodeURIComponent(target.repo)}/pullrequests` +
        `?searchCriteria.status=active&searchCriteria.includeLinks=true&$top=${PAGE_SIZE}&$skip=${skip}&api-version=7.1`;
      const response = await httpGetJson<AzureListResponse<AzureGitPullRequest>>(
        pullRequestsUrl,
        headers,
        config.insecureTls,
        config.caCertPath
      );
      const page = Array.isArray(response.value) ? response.value : [];

      for (const pullRequest of page) {
        const author = normalizeReviewer(pullRequest.createdBy);
        const reviewers = Array.isArray(pullRequest.reviewers)
          ? pullRequest.reviewers.map(normalizeReviewer).filter(Boolean)
          : [];

        pullRequests.push({
          id: Number(pullRequest.pullRequestId || 0),
          title: String(pullRequest.title || '').trim(),
          status: String(pullRequest.status || 'active').trim(),
          repository: target.repo,
          project: target.project,
          author,
          email: String(pullRequest.createdBy?.uniqueName || '').trim(),
          sourceBranch: normalizeBranch(pullRequest.sourceRefName),
          targetBranch: normalizeBranch(pullRequest.targetRefName),
          reviewers,
          createdAt: pullRequest.creationDate || null,
          url: buildPullRequestUrl(config.orgUrl, target.project, target.repo, pullRequest)
        });
      }

      if (page.length < PAGE_SIZE) {
        break;
      }

      skip += page.length;
    }
  }

  return pullRequests.sort((left, right) => {
    const leftTimestamp = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTimestamp = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTimestamp - leftTimestamp;
  });
}
