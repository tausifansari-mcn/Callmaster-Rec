import path from 'node:path';
import { env } from '../../config/env.js';
import { Demos } from '../../repositories/demos.js';
import { notifyTeam } from '../mail.service.js';
import { transcribe } from './deepgram.js';
import { auditTranscript } from './claude.js';
import { getAuditConfig } from './config.js';
import { AuditError } from './errors.js';
import { rubricFor } from './rubrics.js';
import { buildResults } from './scoring.js';

// ---------------------------------------------------------------- tiny concurrency limiter
// Audits call two paid APIs, so cap how many run at once; the rest wait their turn in memory.
let running = 0;
const waiting = [];
function schedule(task) {
  return new Promise((resolve) => {
    const start = () => {
      running += 1;
      task().finally(() => {
        running -= 1;
        waiting.shift()?.();
        resolve();
      });
    };
    if (running < env.audit.concurrency) start(); else waiting.push(start);
  });
}

async function runAudit(id) {
  const job = await Demos.findAuditJob(id);
  if (!job) return;
  const rubric = rubricFor(job.lob);
  const started = Date.now();
  try {
    const filePath = path.join(env.uploadDir, 'audio', path.basename(job.file_stored_name));

    // 1) speech → text (Deepgram)
    await Demos.setAuditStage(id, 'transcribing');
    const cfg = await getAuditConfig(); // keys from Admin → API keys (or .env), resolved per audit
    const meta = await transcribe(filePath, cfg);

    // 2) audit the transcript against the LOB rubric (Claude)
    await Demos.setAuditStage(id, 'auditing');
    const { audit, model, usage } = await auditTranscript({ rubric, turns: meta.turns, meta, cfg });

    const { results, transcript } = buildResults({ rubric, raw: audit, turns: meta.turns, meta, model });
    await Demos.completeAudit(id, { results, transcript });
    console.log(`[audit] #${id} ${rubric.lob}: score ${results.score} in ${Math.round((Date.now() - started) / 1000)}s (${usage?.input_tokens ?? '?'} in / ${usage?.output_tokens ?? '?'} out tokens)`);
  } catch (err) {
    const technical = err instanceof AuditError ? `${err.code}: ${err.message}` : `UNEXPECTED: ${err.message}`;
    console.error(`[audit] #${id} failed — ${technical}`);
    // The public message travels in the error column too, after a marker the poll endpoint recognises.
    const publicMessage = err instanceof AuditError ? err.publicMessage : new AuditError('X', '').publicMessage;
    await Demos.failAudit(id, `${publicMessage}\n---\n${technical}`).catch(() => {});
    notifyTeam('demo', 'Insights audit FAILED', { Demo: `#${id}`, Reason: technical }).catch(() => {});
  }
}

export function startAuditJob(id) {
  schedule(() => runAudit(id).catch((err) => console.error('[audit] job crashed:', err)));
}

/** Splits the stored error into what the visitor may see and the technical detail admins see. */
export function splitAuditError(stored) {
  if (!stored) return { publicMessage: '', technical: '' };
  const [publicMessage, technical = ''] = String(stored).split('\n---\n');
  return { publicMessage, technical };
}
