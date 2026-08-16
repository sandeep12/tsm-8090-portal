/**
 * Smoke test for WO-10 User Management API.
 * Run: npm run smoke:wo10
 */
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/db/connection';
import { UserRepository } from '../src/repositories';
import { UserRole } from '../src/models';
import { hashPassword } from '../src/auth/password';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function main(): Promise<void> {
  process.env.JWT_SECRET = 'wo10-smoke-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(__dirname, '..', '.cache', 'mongodb-binaries');

  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri('tsm-portal-wo10'));

  const users = new UserRepository();
  const passwordHash = await hashPassword('Secret123!');
  await users.create({
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash,
    role: UserRole.Administrator,
  });
  await users.create({
    name: 'Bob',
    email: 'bob@example.com',
    passwordHash,
    role: UserRole.User,
  });

  const app = createApp();

  try {
    const adminToken = (
      await request(app)
        .post('/api/auth/sign-in')
        .send({ email: 'admin@example.com', password: 'Secret123!' })
    ).body.token as string;
    const bobToken = (
      await request(app)
        .post('/api/auth/sign-in')
        .send({ email: 'bob@example.com', password: 'Secret123!' })
    ).body.token as string;

    const denied = await request(app).get('/api/users').set('Authorization', `Bearer ${bobToken}`);
    assert(denied.status === 403, 'non-admin denied list');

    const listed = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    assert(listed.status === 200, 'admin list');
    assert(listed.body.users.length === 2, 'two users');

    const invalid = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', email: 'bad', password: 'short' });
    assert(invalid.status === 400, 'validation');
    const fields = (invalid.body.errors as { field: string }[]).map((e) => e.field);
    assert(fields.includes('name'), 'name required');
    assert(fields.includes('email'), 'email invalid');
    assert(fields.includes('password'), 'password invalid');

    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Carol',
        email: 'carol@example.com',
        password: 'Secret123!',
      });
    assert(created.status === 201, 'create');
    assert(created.body.user.role === UserRole.User, 'default role User');
    assert(created.body.user.active === true, 'default active');
    assert(created.body.user.passwordHash === undefined, 'no hash leakage');
    const carolId = created.body.user.id as string;

    const duplicate = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Clone',
        email: 'carol@example.com',
        password: 'Secret123!',
      });
    assert(duplicate.status === 409, 'duplicate email');
    assert(duplicate.body.code === 'DUPLICATE_EMAIL', 'duplicate code');

    const updated = await request(app)
      .patch(`/api/users/${carolId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Carol Updated', email: 'carol2@example.com' });
    assert(updated.status === 200, 'update');
    assert(updated.body.user.name === 'Carol Updated', 'name saved');

    const roleChange = await request(app)
      .patch(`/api/users/${carolId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.Administrator });
    assert(roleChange.body.user.role === UserRole.Administrator, 'role changed');

    const deactivated = await request(app)
      .patch(`/api/users/${carolId}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    assert(deactivated.body.user.active === false, 'deactivated');

    const carolLogin = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'carol2@example.com', password: 'Secret123!' });
    assert(carolLogin.status === 403, 'deactivated cannot sign in');

    const missing = await request(app)
      .get('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(missing.status === 404, 'missing user');

    console.log('WO-10 smoke test PASSED');
  } finally {
    await disconnectDatabase();
    await mongod.stop();
  }
}

main().catch((error) => {
  console.error('WO-10 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
