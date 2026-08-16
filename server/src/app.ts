import express, { type Express } from 'express';
import { createApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/** Build the Express application (no listen / DB connect). */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
