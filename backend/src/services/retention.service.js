import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { Demos } from '../repositories/demos.js';
import { Otps } from '../repositories/otps.js';

const DAY = 24 * 3600 * 1000;

/**
 * Enforces the published Data Retention Policy: demo audio is deleted after DATA_RETENTION_DAYS (default 30).
 * The demo record itself is kept (it's a lead), only the recording is purged.
 */
export async function purgeExpiredAudio() {
  const stale = await Demos.expiredRecordings(new Date(Date.now() - env.dataRetentionDays * DAY));
  for (const demo of stale) {
    await fs.promises.unlink(path.join(env.uploadDir, 'audio', path.basename(demo.file_stored_name))).catch(() => {});
    await Demos.clearRecording(demo.id);
  }
  if (stale.length) console.log(`[retention] purged ${stale.length} expired audio file(s)`);
}

export function startRetentionJob() {
  const run = () => Promise.all([purgeExpiredAudio(), Otps.purgeExpired(), Demos.failStaleAudits(new Date(Date.now() - 15 * 60 * 1000))]).catch((err) => console.error('[retention] failed:', err.message));
  run();
  const timer = setInterval(run, DAY / 4); // OTPs are swept every 6 hours, recordings are checked at the same cadence
  timer.unref();
  return timer;
}
