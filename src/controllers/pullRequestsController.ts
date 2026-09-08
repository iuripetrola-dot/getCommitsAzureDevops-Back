import { Request, Response } from 'express';
import { collectOpenPullRequests } from '../services/pullRequestService';

export async function openPullRequestsController(_request: Request, response: Response): Promise<void> {
  const pullRequests = await collectOpenPullRequests();

  response.json({
    generatedAt: new Date().toISOString(),
    totalPullRequests: pullRequests.length,
    pullRequests
  });
}
