import { Request, Response } from 'express';
import { loadRootConfig } from '../services/configService';

export async function configController(_request: Request, response: Response): Promise<void> {
  const config = await loadRootConfig();

  response.json({
    server: config.server,
    orgUrl: config.azureDevops.orgUrl,
    daysAgo: config.azureDevops.daysAgo,
    insecureTls: config.azureDevops.insecureTls,
    caCertPath: config.azureDevops.caCertPath,
    authors: config.azureDevops.authors,
    repositories: config.azureDevops.repositories,
    authorEmails: config.azureDevops.authorEmails
  });
}
