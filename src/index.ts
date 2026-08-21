import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { getAppConfig } from './config/appConfig';
import { router } from './routes';
import { loadRootConfig } from './services/configService';

async function bootstrap(): Promise<void> {
  const rootConfig = await loadRootConfig();
  const appConfig = getAppConfig();
  const app = express();

  app.use(cors({ origin: rootConfig.server.corsOrigin }));
  app.use(express.json());
  app.use('/api', router);

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha interna no servidor.'
    });
  });

  app.listen(rootConfig.server.port, () => {
    console.log(`Back-nodejs em execucao na porta ${rootConfig.server.port}`);
    console.log(`Config: ${appConfig.configFile}`);
  });
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar o Back-nodejs:', error instanceof Error ? error.message : error);
  process.exit(1);
});
