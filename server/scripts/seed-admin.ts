/**
 * Seed demo users and tasks for local development.
 *
 * Usage:
 *   cd server
 *   npm run seed:admin
 *
 * All seeded users share password Secret123! (or SEED_ADMIN_PASSWORD).
 * Optional:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME
 *   SEED_FORCE_TASKS=1  — add demo tasks even if some tasks already exist
 */
import { config as loadEnv } from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../src/db/connection';
import { TaskRepository, UserRepository } from '../src/repositories';
import { TaskModel, TaskPriority, TaskStatus, UserRole } from '../src/models';
import { hashPassword } from '../src/auth/password';
import type { UserDocument } from '../src/models';

loadEnv();

const DEFAULT_PASSWORD = 'Secret123!';

type SeedUser = {
  name: string;
  email: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  active?: boolean;
};

const DEMO_USERS: SeedUser[] = [
  { name: 'Alice Admin', email: 'admin@example.com', role: UserRole.Administrator },
  { name: 'Bob Builder', email: 'bob@example.com', role: UserRole.User },
  { name: 'Carol Chen', email: 'carol@example.com', role: UserRole.User },
  { name: 'Dave Diaz', email: 'dave@example.com', role: UserRole.User },
  { name: 'Eve Inactive', email: 'eve@example.com', role: UserRole.User, active: false },
];

async function ensureUser(
  users: UserRepository,
  spec: SeedUser,
  passwordHash: string,
): Promise<UserDocument> {
  const email = spec.email.trim().toLowerCase();
  const existing = await users.findByEmail(email);
  if (existing) {
    console.log(`  user exists: ${email} (${spec.role})`);
    return existing;
  }

  const created = await users.create({
    name: spec.name,
    email,
    passwordHash,
    role: spec.role,
    active: spec.active ?? true,
  });
  console.log(`  user created: ${email} (${spec.role}${spec.active === false ? ', inactive' : ''})`);
  return created;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main(): Promise<void> {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Alice Admin';
  const forceTasks = process.env.SEED_FORCE_TASKS === '1';

  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDatabase();
  const users = new UserRepository();
  const tasks = new TaskRepository(users);

  try {
    const passwordHash = await hashPassword(password);

    console.log('Seeding users…');
    const byEmail = new Map<string, UserDocument>();

    for (const spec of DEMO_USERS) {
      const resolved: SeedUser =
        spec.email === 'admin@example.com'
          ? { ...spec, email: adminEmail, name: adminName }
          : spec;
      const user = await ensureUser(users, resolved, passwordHash);
      byEmail.set(resolved.email.trim().toLowerCase(), user);
    }

    const bob = byEmail.get('bob@example.com');
    const carol = byEmail.get('carol@example.com');
    const dave = byEmail.get('dave@example.com');
    const admin = byEmail.get(adminEmail);

    if (!bob || !carol || !dave || !admin) {
      throw new Error('Expected demo users were not created');
    }

    const existingTaskCount = await TaskModel.countDocuments().exec();
    if (existingTaskCount > 0 && !forceTasks) {
      console.log(`Tasks already present (${existingTaskCount}); skip task seed (SEED_FORCE_TASKS=1 to add more).`);
    } else {
      console.log('Seeding tasks…');
      const demoTasks = [
        {
          title: 'Draft Q3 roadmap',
          description: 'Outline milestones for the portal release.',
          priority: TaskPriority.High,
          status: TaskStatus.InProgress,
          dueDate: daysFromNow(3),
          assignedUserId: bob._id,
        },
        {
          title: 'Fix login redirect bug',
          description: 'Users land on 404 after sign-in in some browsers.',
          priority: TaskPriority.High,
          status: TaskStatus.ToDo,
          dueDate: daysFromNow(1),
          assignedUserId: bob._id,
        },
        {
          title: 'Write onboarding docs',
          description: 'How to seed data and sign in locally.',
          priority: TaskPriority.Medium,
          status: TaskStatus.ToDo,
          dueDate: daysFromNow(7),
          assignedUserId: carol._id,
        },
        {
          title: 'Polish dashboard charts',
          description: 'Tighten spacing and empty states.',
          priority: TaskPriority.Low,
          status: TaskStatus.InProgress,
          dueDate: daysFromNow(5),
          assignedUserId: carol._id,
        },
        {
          title: 'Archive old completed tasks',
          description: 'One-time cleanup after migration.',
          priority: TaskPriority.Low,
          status: TaskStatus.Done,
          dueDate: daysFromNow(-2),
          assignedUserId: dave._id,
        },
        {
          title: 'Review user directory permissions',
          description: 'Confirm only admins can create/deactivate users.',
          priority: TaskPriority.Medium,
          status: TaskStatus.Done,
          dueDate: daysFromNow(-1),
          assignedUserId: admin._id,
        },
        {
          title: 'Prepare demo for stakeholders',
          description: 'Walk through list, filters, and dashboard.',
          priority: TaskPriority.High,
          status: TaskStatus.ToDo,
          dueDate: daysFromNow(2),
          assignedUserId: dave._id,
        },
      ];

      for (const input of demoTasks) {
        const created = await tasks.create(input);
        console.log(`  task: ${created.title} → ${input.status}`);
      }
    }

    console.log('\nDone. Sign in at http://127.0.0.1:5173/sign-in');
    console.log(`  Admin:  ${adminEmail} / ${password}`);
    console.log(`  Users:  bob@example.com, carol@example.com, dave@example.com / ${password}`);
    console.log('  Inactive (cannot sign in): eve@example.com');
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error('Seed failed');
  console.error(error);
  process.exit(1);
});
