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

function isStreamRequest(request: Request): boolean {
  return request.query.stream === 'true';
}

function sendServerSentEvent(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function listCommitsController(request: Request, response: Response): Promise<void> {
  if (!isStreamRequest(request)) {
    const data = await collectCommits(resolveDaysAgo(request));
    await saveLastCommitsResult(data);
    response.json(data);
    return;
  }

  response.status(200);
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders();

  try {
    const data = await collectCommits(resolveDaysAgo(request), (line) => {
      sendServerSentEvent(response, 'log', { line });
    });
    await saveLastCommitsResult(data);
    sendServerSentEvent(response, 'result', data);
  } catch (error) {
    sendServerSentEvent(response, 'error', {
      message: error instanceof Error ? error.message : 'Falha interna no servidor.'
    });
  } finally {
    response.end();
  }
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
