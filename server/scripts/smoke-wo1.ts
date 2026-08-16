/**
 * Smoke test for WO-1 persistence against a real MongoDB engine
 * (mongodb-memory-server — no external mongod required).
 *
 * Run: npx tsx scripts/smoke-wo1.ts
 */
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDatabase,
  disconnectDatabase,
  UserRepository,
  TaskRepository,
  UserRole,
  TaskPriority,
  TaskStatus,
  DuplicateEmailError,
  InvalidAssigneeError,
} from '../src';

async function assert(condition: unknown, message: string): Promise<void> {
  if (!condition) {
    throw new Error(`ASSERT: ${message}`);
  }
}

async function main(): Promise<void> {
  // Keep downloaded mongod binaries inside the workspace (sandbox-friendly).
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(__dirname, '..', '.cache', 'mongodb-binaries');

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('tsm-portal-smoke');

  console.log('Mongo memory server:', uri);
  await connectDatabase(uri);

  const users = new UserRepository();
  const tasks = new TaskRepository(users);

  try {
    const alice = await users.create({
      name: 'Alice Admin',
      email: 'alice@example.com',
      passwordHash: 'hash-alice',
      role: UserRole.Administrator,
    });
    await assert(alice.active === true, 'new user defaults active');
    await assert(alice.role === UserRole.Administrator, 'role persisted');

    const byEmail = await users.findByEmail('ALICE@example.com');
    await assert(byEmail?._id.equals(alice._id), 'email lookup is case-insensitive');

    let duplicateThrown = false;
    try {
      await users.create({
        name: 'Clone',
        email: 'alice@example.com',
        passwordHash: 'x',
      });
    } catch (error) {
      duplicateThrown = error instanceof DuplicateEmailError;
    }
    await assert(duplicateThrown, 'duplicate email surfaces DuplicateEmailError');

    const bob = await users.create({
      name: 'Bob User',
      email: 'bob@example.com',
      passwordHash: 'hash-bob',
    });

    const task = await tasks.create({
      title: 'Ship WO-1',
      description: 'Persistence smoke',
      priority: TaskPriority.High,
      assignedUserId: bob._id,
    });
    await assert(task.status === TaskStatus.ToDo, 'task defaults to To Do');

    await users.setActive(bob._id, false);
    let invalidAssignee = false;
    try {
      await tasks.create({
        title: 'Should fail',
        priority: TaskPriority.Low,
        assignedUserId: bob._id,
      });
    } catch (error) {
      invalidAssignee = error instanceof InvalidAssigneeError;
    }
    await assert(invalidAssignee, 'inactive assignee rejected');

    await users.setActive(bob._id, true);
    await tasks.update(task._id, { status: TaskStatus.InProgress, title: 'Ship WO-1 (updated)' });

    const scoped = await tasks.list({ assignedUserId: bob._id, status: TaskStatus.InProgress });
    await assert(scoped.length === 1, 'scoped list returns Bob in-progress task');

    const searched = await tasks.list({ titleSearch: 'ship' });
    await assert(searched.length === 1, 'title search matches');

    const counts = await tasks.getStatusCounts({ assignedUserId: bob._id });
    await assert(counts.total === 1 && counts.inProgress === 1, 'status counts for Bob');

    const recent = await tasks.findRecent({}, 5);
    await assert(recent[0]?._id.equals(task._id), 'recent activity returns updated task first');

    const allUsers = await users.list();
    await assert(allUsers.length === 2, 'list users');

    await tasks.delete(task._id);
    await assert((await tasks.findById(task._id)) === null, 'delete removes task');

    console.log('WO-1 smoke test PASSED');
  } finally {
    await disconnectDatabase();
    await mongod.stop();
  }
}

main().catch((error) => {
  console.error('WO-1 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
