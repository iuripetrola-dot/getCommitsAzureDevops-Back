import { NextFunction, Request, Response } from 'express';
import { BranchValidationError, setBranchLock } from '../services/branchService';

interface BranchLockBody {
  project?: unknown;
  repository?: unknown;
  branch?: unknown;
  locked?: unknown;
}

export async function branchLockController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const body = request.body as BranchLockBody;
  const project = typeof body.project === 'string' ? body.project.trim() : '';
  const repository = typeof body.repository === 'string' ? body.repository.trim() : '';
  const branch = typeof body.branch === 'string' ? body.branch.trim() : '';

  if (!project || !repository || !branch || typeof body.locked !== 'boolean') {
    response.status(400).json({
      message: 'Informe project, repository, branch e locked (boolean).'
    });
    return;
  }

  try {
    const result = await setBranchLock(project, repository, branch, body.locked);
    response.json(result);
  } catch (error) {
    if (error instanceof BranchValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
}
