import { getAppConfig } from '../config/appConfig';
import { AzureBranchLockRef, BranchLockResult } from '../types/azureDevops';
import { httpPatchJson } from './azureDevopsHttpService';
import { loadRootConfig } from './configService';

export class BranchValidationError extends Error {}

function normalizeBranch(branch: string): string {
  return branch.trim().replace(/^refs\/heads\//, '').replace(/^heads\//, '');
}

export async function setBranchLock(
  project: string,
  repository: string,
  branchValue: string,
  locked: boolean
): Promise<BranchLockResult> {
  const appConfig = getAppConfig();
  const config = await loadRootConfig();
  const branch = normalizeBranch(branchValue);

  if (!branch) {
    throw new BranchValidationError('Informe uma branch valida.');
  }

  if (!config.azureDevops.base64AuthInfo) {
    throw new Error(`Defina azureDevops.base64AuthInfo no arquivo ${appConfig.configFile}.`);
  }

  const configuredRepository = config.azureDevops.repositories.some(
    (item) =>
      item.project.toLowerCase() === project.toLowerCase() &&
      item.repo.toLowerCase() === repository.toLowerCase()
  );

  if (!configuredRepository) {
    throw new BranchValidationError(`Repositorio ${project}/${repository} nao esta configurado.`);
  }

  const url =
    `${config.azureDevops.orgUrl}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repository)}/refs` +
    `?filter=${encodeURIComponent(`heads/${branch}`)}&api-version=7.1`;
  const result = await httpPatchJson<AzureBranchLockRef, { isLocked: boolean }>(
    url,
    {
      Authorization: `Basic ${config.azureDevops.base64AuthInfo}`,
      Accept: 'application/json'
    },
    { isLocked: locked },
    config.azureDevops.insecureTls,
    config.azureDevops.caCertPath
  );

  return {
    project,
    repository,
    branch,
    locked: Boolean(result.isLocked),
    lockedBy: String(result.isLockedBy?.displayName || result.isLockedBy?.uniqueName || '')
  };
}
