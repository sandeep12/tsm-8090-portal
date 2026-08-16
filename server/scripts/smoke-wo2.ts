/**
 * Smoke test for WO-2: Express bootstrap, validation middleware, ErrorHandler.
 *
 * Run: npm run smoke:wo2
 */
import express from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { validateRequest } from '../src/middleware/validate';
import { errorHandler } from '../src/middleware/error-handler';
import { DuplicateEmailError } from '../src/repositories/errors';
import { taskInputSchema, userInputSchema } from '../src/validation';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERT: ${message}`);
  }
}

function createValidationProbeApp() {
  const app = express();
  app.use(express.json());
  app.post('/users', validateRequest(userInputSchema), (req, res) => {
    res.status(200).json(req.body);
  });
  app.post('/tasks', validateRequest(taskInputSchema), (req, res) => {
    res.status(200).json(req.body);
  });
  app.get('/boom-conflict', (_req, _res, next) => {
    next(new DuplicateEmailError('taken@example.com'));
  });
  app.use(errorHandler);
  return app;
}

async function main(): Promise<void> {
  const app = createApp();
  const probe = createValidationProbeApp();

  const health = await request(app).get('/api/health');
  assert(health.status === 200, 'GET /api/health returns 200');
  assert(health.body.status === 'ok', 'health body');

  const missing = await request(app).get('/api/does-not-exist');
  assert(missing.status === 404, 'unknown route → 404');
  assert(missing.body.code === 'NOT_FOUND', 'not-found code');
  assert(typeof missing.body.message === 'string', 'error message present');
  assert(missing.body.stack === undefined, 'no stack leakage');

  const invalidUser = await request(probe)
    .post('/users')
    .send({ name: '', email: 'not-an-email', role: 'Nope' });
  assert(invalidUser.status === 400, 'invalid user → 400');
  assert(invalidUser.body.code === 'VALIDATION_ERROR', 'validation code');
  assert(Array.isArray(invalidUser.body.errors), 'per-field errors array');
  assert(invalidUser.body.errors.length >= 2, 'reports every invalid field');
  assert(invalidUser.body.stack === undefined, 'no stack on validation error');

  const validUser = await request(probe)
    .post('/users')
    .send({ name: 'Ada', email: 'ada@example.com', role: 'Administrator' });
  assert(validUser.status === 200, 'valid user passes middleware');

  const invalidTask = await request(probe).post('/tasks').send({ title: '' });
  assert(invalidTask.status === 400, 'invalid task → 400');
  const fields = (invalidTask.body.errors as { field: string }[]).map((e) => e.field);
  assert(fields.includes('title'), 'title invalid');
  assert(fields.includes('priority'), 'priority invalid');
  assert(fields.includes('assignedUserId'), 'assignedUserId invalid');

  const conflict = await request(probe).get('/boom-conflict');
  assert(conflict.status === 409, 'DuplicateEmailError → 409');
  assert(conflict.body.code === 'DUPLICATE_EMAIL', 'duplicate email code');

  console.log('WO-2 smoke test PASSED');
}

main().catch((error) => {
  console.error('WO-2 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
