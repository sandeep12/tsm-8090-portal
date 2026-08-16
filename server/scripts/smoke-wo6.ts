/**
 * Smoke test for WO-6 Task API (CRUD, scope, search, filter, validation).
 * Run: npm run smoke:wo6
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
  process.env.JWT_SECRET = 'wo6-smoke-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(__dirname, '..', '.cache', 'mongodb-binaries');

  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri('tsm-portal-wo6'));

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
      await request(app).post('/api/auth/sign-in').send({
        email: 'admin@example.com',
        password: 'Secret123!',
      })
    ).body.token as string;
    const bobToken = (
      await request(app).post('/api/auth/sign-in').send({
        email: 'bob@example.com',
        password: 'Secret123!',
      })
    ).body.token as string;

    const invalid = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: '', priority: 'Nope' });
    assert(invalid.status === 400, 'validation rejects incomplete task');
    const fields = (invalid.body.errors as { field: string }[]).map((e) => e.field);
    assert(fields.includes('title'), 'title required');
    assert(fields.includes('priority'), 'priority required');
    assert(fields.includes('assignedUserId'), 'assignee required');

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        title: 'Write docs',
        priority: TaskPriority.High,
        assignedUserId: String(bob._id),
      });
    assert(created.status === 201, 'create task');
    assert(created.body.task.status === TaskStatus.ToDo, 'defaults to To Do');
    const bobTaskId = created.body.task.id as string;

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Carol chore',
        priority: TaskPriority.Low,
        assignedUserId: String(carol._id),
        status: TaskStatus.InProgress,
      });

    const bobList = await request(app).get('/api/tasks').set('Authorization', `Bearer ${bobToken}`);
    assert(bobList.status === 200, 'bob list');
    assert(bobList.body.tasks.length === 1, 'bob sees only own tasks');
    assert(bobList.body.tasks[0].id === bobTaskId, 'bob task id');

    const adminList = await request(app).get('/api/tasks').set('Authorization', `Bearer ${adminToken}`);
    assert(adminList.body.tasks.length === 2, 'admin sees all tasks');

    const denied = await request(app)
      .get(`/api/tasks/${adminList.body.tasks.find((t: { title: string }) => t.title === 'Carol chore').id}`)
      .set('Authorization', `Bearer ${bobToken}`);
    assert(denied.status === 403, 'bob cannot read carol task');

    const missing = await request(app)
      .get('/api/tasks/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(missing.status === 404, 'missing task');
    assert(String(missing.body.message).toLowerCase().includes('unavailable'), 'unavailable message');

    const searched = await request(app)
      .get('/api/tasks')
      .query({ q: 'docs' })
      .set('Authorization', `Bearer ${adminToken}`);
    assert(searched.body.tasks.length === 1, 'title search');

    const filtered = await request(app)
      .get('/api/tasks')
      .query({ status: TaskStatus.InProgress, priority: TaskPriority.Low })
      .set('Authorization', `Bearer ${adminToken}`);
    assert(filtered.body.tasks.length === 1, 'status+priority filter');
    assert(filtered.body.tasks[0].title === 'Carol chore', 'filtered task');

    const statusChange = await request(app)
      .patch(`/api/tasks/${bobTaskId}/status`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ status: TaskStatus.Done });
    assert(statusChange.status === 200, 'status change');
    assert(statusChange.body.task.status === TaskStatus.Done, 'status saved');

    const updated = await request(app)
      .patch(`/api/tasks/${bobTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Write docs (edited)', assignedUserId: String(carol._id) });
    assert(updated.status === 200, 'admin can reassign');
    assert(updated.body.task.assignedUserId === String(carol._id), 'reassigned');

    const bobCannotEdit = await request(app)
      .patch(`/api/tasks/${bobTaskId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Nope' });
    assert(bobCannotEdit.status === 403, 'bob lost access after reassignment');

    const deleted = await request(app)
      .delete(`/api/tasks/${bobTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(deleted.status === 204, 'delete');

    const inactiveAssignee = await users.setActive(carol._id, false);
    void inactiveAssignee;
    const badAssignee = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Bad assignee',
        priority: TaskPriority.Medium,
        assignedUserId: String(carol._id),
      });
    assert(badAssignee.status === 400, 'inactive assignee rejected');

    void admin;
    console.log('WO-6 smoke test PASSED');
  } finally {
    await disconnectDatabase();
    await mongod.stop();
  }
}

main().catch((error) => {
  console.error('WO-6 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
