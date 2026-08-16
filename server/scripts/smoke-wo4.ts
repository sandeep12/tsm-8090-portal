/**
 * Smoke test for WO-4 authentication & authorization backend.
 * Run: npm run smoke:wo4
 */
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/db/connection';
import { UserRepository } from '../src/repositories';
import { UserRole } from '../src/models';
import { hashPassword } from '../src/auth/password';
import { requireAuth } from '../src/middleware/authenticate';
import { requireAdmin, requireTaskOwner } from '../src/middleware/authorize';
import { errorHandler } from '../src/middleware/error-handler';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function main(): Promise<void> {
  process.env.JWT_SECRET = 'wo4-smoke-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(__dirname, '..', '.cache', 'mongodb-binaries');

  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri('tsm-portal-wo4'));

  const users = new UserRepository();
  const passwordHash = await hashPassword('Secret123!');
  const alice = await users.create({
    name: 'Alice Admin',
    email: 'alice@example.com',
    passwordHash,
    role: UserRole.Administrator,
  });
  const bob = await users.create({
    name: 'Bob User',
    email: 'bob@example.com',
    passwordHash,
    role: UserRole.User,
  });
  const inactive = await users.create({
    name: 'Inactive',
    email: 'gone@example.com',
    passwordHash,
    active: false,
  });

  const app = createApp();

  try {
    const badUnknown = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'missing@example.com', password: 'Secret123!' });
    assert(badUnknown.status === 401, 'unknown email → 401');
    assert(badUnknown.body.message === 'Email or password is incorrect', 'non-revealing message');

    const badPassword = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'alice@example.com', password: 'wrong' });
    assert(badPassword.status === 401, 'bad password → 401');
    assert(badPassword.body.message === badUnknown.body.message, 'same message for unknown email');

    const inactiveLogin = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'gone@example.com', password: 'Secret123!' });
    assert(inactiveLogin.status === 403, 'inactive → 403');
    assert(String(inactiveLogin.body.message).toLowerCase().includes('not active'), 'inactive message');

    const signIn = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'alice@example.com', password: 'Secret123!' });
    assert(signIn.status === 200, 'sign-in success');
    assert(typeof signIn.body.token === 'string', 'returns token');
    assert(signIn.body.user.email === 'alice@example.com', 'returns user dto');
    assert(signIn.body.user.passwordHash === undefined, 'no password hash leakage');

    const token = signIn.body.token as string;
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert(me.status === 200, 'current session');
    assert(me.body.user.id === String(alice._id), 'session user id');

    const noToken = await request(app).get('/api/auth/me');
    assert(noToken.status === 401, 'missing token → 401');

    await users.setActive(alice._id, false);
    const deactivated = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert(deactivated.status === 401, 'deactivated mid-session → 401');
    await users.setActive(alice._id, true);

    const bobSignIn = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'bob@example.com', password: 'Secret123!' });
    const bobToken = bobSignIn.body.token as string;

    const probe = express();
    probe.get('/admin', requireAuth(), requireAdmin(), (_req, res) => res.json({ ok: true }));
    probe.get(
      '/tasks/:assignedUserId',
      requireAuth(),
      requireTaskOwner((req) => req.params.assignedUserId),
      (_req, res) => res.json({ ok: true }),
    );
    probe.use(errorHandler);

    const adminOk = await request(probe)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    assert(adminOk.status === 200, 'admin can access admin route');

    const userForbidden = await request(probe)
      .get('/admin')
      .set('Authorization', `Bearer ${bobToken}`);
    assert(userForbidden.status === 403, 'user denied admin route');

    const ownTask = await request(probe)
      .get(`/tasks/${String(bob._id)}`)
      .set('Authorization', `Bearer ${bobToken}`);
    assert(ownTask.status === 200, 'user can access own task scope');

    const othersTask = await request(probe)
      .get(`/tasks/${String(alice._id)}`)
      .set('Authorization', `Bearer ${bobToken}`);
    assert(othersTask.status === 403, 'user cannot access others task');

    const adminAny = await request(probe)
      .get(`/tasks/${String(bob._id)}`)
      .set('Authorization', `Bearer ${token}`);
    assert(adminAny.status === 200, 'admin can access any task scope');

    const signOut = await request(app).post('/api/auth/sign-out').set('Authorization', `Bearer ${token}`);
    assert(signOut.status === 204, 'sign-out');

    // silence unused in build
    void inactive;

    console.log('WO-4 smoke test PASSED');
  } finally {
    await disconnectDatabase();
    await mongod.stop();
  }
}

main().catch((error) => {
  console.error('WO-4 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
