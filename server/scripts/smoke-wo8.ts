/**
 * Smoke test for WO-8 Dashboard summary API.
 * Run: npm run smoke:wo8
 */
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/db/connection';
import { UserRepository } from '../src/repositories';
import { UserRole, TaskPriority, TaskStatus } from '../src/models';
import { hashPassword } from '../src/auth/password';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function main(): Promise<void> {
  process.env.JWT_SECRET = 'wo8-smoke-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(__dirname, '..', '.cache', 'mongodb-binaries');

  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri('tsm-portal-wo8'));

  const users = new UserRepository();
  const passwordHash = await hashPassword('Secret123!');
  const admin = await users.create({
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash,
    role: UserRole.Administrator,
  });
  const bob = await users.create({
    name: 'Bob',
    email: 'bob@example.com',
    passwordHash,
    role: UserRole.User,
  });
  const carol = await users.create({
    name: 'Carol',
    email: 'carol@example.com',
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

    const empty = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${bobToken}`);
    assert(empty.status === 200, 'empty dashboard ok');
    assert(empty.body.counts.total === 0, 'zero total');
    assert(empty.body.counts.toDo === 0, 'zero to do');
    assert(empty.body.recentTasks.length === 0, 'empty recent');

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        title: 'Bob todo',
        priority: TaskPriority.High,
        assignedUserId: String(bob._id),
        status: TaskStatus.ToDo,
      });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Bob doing',
        priority: TaskPriority.Medium,
        assignedUserId: String(bob._id),
        status: TaskStatus.InProgress,
      });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Carol done',
        priority: TaskPriority.Low,
        assignedUserId: String(carol._id),
        status: TaskStatus.Done,
      });

    const bobDash = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${bobToken}`);
    assert(bobDash.status === 200, 'bob dashboard');
    assert(bobDash.body.counts.total === 2, 'bob total scoped');
    assert(bobDash.body.counts.toDo === 1, 'bob to do');
    assert(bobDash.body.counts.inProgress === 1, 'bob in progress');
    assert(bobDash.body.counts.done === 0, 'bob done');
    assert(bobDash.body.recentTasks.length === 2, 'bob recent only own');
    assert(
      bobDash.body.recentTasks.every(
        (task: { assignedUserId: string }) => task.assignedUserId === String(bob._id),
      ),
      'bob recent scoped',
    );

    const adminDash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDash.body.counts.total === 3, 'admin total');
    assert(adminDash.body.counts.toDo === 1, 'admin to do');
    assert(adminDash.body.counts.inProgress === 1, 'admin in progress');
    assert(adminDash.body.counts.done === 1, 'admin done');
    assert(adminDash.body.recentTasks.length === 3, 'admin recent all');
    assert(
      new Date(adminDash.body.recentTasks[0].updatedAt).getTime() >=
        new Date(adminDash.body.recentTasks[1].updatedAt).getTime(),
      'recent most-recent-first',
    );

    const unauth = await request(app).get('/api/dashboard');
    assert(unauth.status === 401, 'requires auth');

    void admin;
    console.log('WO-8 smoke test PASSED');
  } finally {
    await disconnectDatabase();
    await mongod.stop();
  }
}

main().catch((error) => {
  console.error('WO-8 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
