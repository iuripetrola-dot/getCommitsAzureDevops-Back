import { Request, Response } from 'express';

export function healthController(_request: Request, response: Response): void {
  response.json({ status: 'ok', date: new Date().toISOString() });
}
