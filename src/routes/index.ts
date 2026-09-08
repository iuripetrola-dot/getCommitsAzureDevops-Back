import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import { configController } from '../controllers/configController';
import { exportCommitsController, lastCommitsController, listCommitsController } from '../controllers/commitsController';
import { openPullRequestsController } from '../controllers/pullRequestsController';

export const router = Router();

router.get('/health', healthController);
router.get('/config', configController);
router.get('/commits', listCommitsController);
router.get('/commits/last', lastCommitsController);
router.get('/commits/export', exportCommitsController);
router.get('/pull-requests/open', openPullRequestsController);
