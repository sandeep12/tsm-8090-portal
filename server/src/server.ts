import { createApp } from './app';
import { config, assertServerConfig } from './config/env';
import { connectDatabase } from './db/connection';

async function main(): Promise<void> {
  assertServerConfig();
  await connectDatabase();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API server listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start API server', error);
  process.exit(1);
});
