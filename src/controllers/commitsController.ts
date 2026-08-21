import { Request, Response } from 'express';
import { collectCommits } from '../services/commitService';
import { getLastCommitsResult, saveLastCommitsResult } from '../services/commitCacheService';
import { buildCommitCsv } from '../utils/csvUtils';

function resolveDaysAgo(request: Request): number | undefined {
  const rawValue = request.query.daysAgo;
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function listCommitsController(request: Request, response: Response): Promise<void> {
  const data = await collectCommits(resolveDaysAgo(request));
  await saveLastCommitsResult(data);
  response.json(data);
}

export async function lastCommitsController(_request: Request, response: Response): Promise<void> {
  const data = await getLastCommitsResult();

  if (!data) {
    response.status(404).json({
      message: 'Nenhuma consulta anterior encontrada no backend.'
    });
    return;
  }

  response.json(data);
}

export async function exportCommitsController(request: Request, response: Response): Promise<void> {
  const data = await getLastCommitsResult();

  if (!data) {
    response.status(404).json({
      message: 'Nenhuma consulta anterior encontrada no backend para exportacao.'
    });
    return;
  }

  const csv = buildCommitCsv(data.commits);

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="commits-azure-devops-${Date.now()}.csv"`);
  response.send(csv);
}
