import { assertEnv, env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';
import { seedDefaults } from './seed/index.js';
import { startRetentionJob } from './services/retention.service.js';

async function main() {
  assertEnv();
  await connectDb();
  await seedDefaults();
  startRetentionJob();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] API listening on http://localhost:${env.port}  (${env.nodeEnv}, payments: ${env.paymentMode}, sandbox OTP: ${env.sandboxMode})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  if (err.isConfigError) console.error(`\n${err.message}\n`);
  else console.error('[server] failed to start:', err);
  process.exit(1);
});
