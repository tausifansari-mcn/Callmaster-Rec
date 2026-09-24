import { exec, one, query } from '../config/db.js';
import { flag, makeResource, parseJson, toJson } from './_util.js';

/** `full` adds the (large) transcript; list views leave it out. */
const mapOne = (r, opts = {}) => ({
  id: r.id,
  type: r.type,
  name: r.name,
  company: r.company,
  email: r.email,
  lob: r.lob,
  framework: r.framework,
  file: r.file_original_name || r.file_stored_name
    ? { originalName: r.file_original_name, storedName: r.file_stored_name, size: r.file_size }
    : null,
  auditStatus: r.audit_status,
  auditStage: r.audit_stage,
  auditError: r.audit_error,
  results: parseJson(r.results),
  ...(opts.full ? { transcript: parseJson(r.transcript) } : {}),
  phone: r.phone,
  industry: r.industry,
  callType: r.call_type,
  gender: r.gender,
  language: r.language,
  consent: flag(r.consent),
  callStatus: r.call_status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * One table (demo_sessions) holds both demos. A visitor is written as soon as they finish step 1
 * ("registered": name / organization / email) and the same row is completed later:
 *   audit → recording, line of business, background audit status, report and transcript
 *   voice → bot configuration, verified phone, consent and call status
 */
export const Demos = {
  ...makeResource({
    table: 'demo_sessions',
    map: async (rows, opts) => rows.map((r) => mapOne(r, opts)),
    searchColumns: ['name', 'company', 'email', 'phone'],
    filterColumns: { type: 'type' },
    patchable: [],
  }),

  // ---------------------------------------------------------------- registration (step 1 / step 5)
  /** Row + secret token for a wizard session, or null. The token proves the caller is the visitor who registered. */
  async findSession(id, type) {
    return one(
      'SELECT id, access_token, audit_status, call_status, email FROM demo_sessions WHERE id = ? AND type = ?',
      [id, type]
    );
  },

  /** An unfinished registration for this email (so repeated Continue clicks don't create duplicates). */
  async findOpenRegistration(type, email, since) {
    const statusCol = type === 'audit' ? 'audit_status' : 'call_status';
    return one(
      `SELECT id FROM demo_sessions WHERE type = ? AND email = ? AND ${statusCol} = 'registered' AND created_at >= ? ORDER BY id DESC LIMIT 1`,
      [type, String(email).toLowerCase(), since]
    );
  },

  async registerAudit(d) {
    const r = await exec(
      "INSERT INTO demo_sessions (type, name, company, email, audit_status, access_token, ip) VALUES ('audit', ?, ?, ?, 'registered', ?, ?)",
      [d.name, d.company, d.email, d.accessToken, d.ip || null]
    );
    return { id: r.insertId };
  },

  async registerVoice(d) {
    const r = await exec(
      `INSERT INTO demo_sessions (type, name, company, email, industry, call_type, gender, language, call_status, access_token, ip)
       VALUES ('voice', ?, ?, ?, ?, ?, ?, ?, 'registered', ?, ?)`,
      [d.name, d.company, d.email, d.industry, d.callType, d.gender, d.language, d.accessToken, d.ip || null]
    );
    return { id: r.insertId };
  },

  /** Visitor went Back and edited step 1 — refresh the same row and issue a fresh token. */
  async updateRegistration(id, d) {
    await exec(
      `UPDATE demo_sessions SET name = ?, company = ?, email = ?, access_token = ?,
         industry = COALESCE(?, industry), call_type = COALESCE(?, call_type), gender = COALESCE(?, gender), language = COALESCE(?, language)
       WHERE id = ?`,
      [d.name, d.company, d.email, d.accessToken, d.industry ?? null, d.callType ?? null, d.gender ?? null, d.language ?? null, id]
    );
  },

  // ---------------------------------------------------------------- audit (step 2 → report)
  /**
   * Attaches the recording and line of business to the registered visitor.
   * `status` is 'processing' for a live audit that runs in the background, 'completed' when results are supplied up front.
   */
  async submitAudit(id, d) {
    await exec(
      `UPDATE demo_sessions SET lob = ?, framework = ?, file_original_name = ?, file_stored_name = ?, file_size = ?,
         audit_status = ?, audit_stage = ?, audit_error = NULL, results = ?, transcript = ? WHERE id = ?`,
      [d.lob, d.framework, d.file?.originalName ?? null, d.file?.storedName ?? null, d.file?.size ?? null,
        d.status, d.status === 'processing' ? 'transcribing' : null, toJson(d.results), toJson(d.transcript), id]
    );
  },

  /** What the uploader's browser sees while polling. The token proves it is the uploader. */
  async findAuditForPoll(id) {
    const r = await one("SELECT id, access_token, audit_status, audit_stage, audit_error, lob, framework, name, company, email, results, transcript FROM demo_sessions WHERE id = ? AND type = 'audit'", [id]);
    if (!r) return null;
    return {
      id: r.id, accessToken: r.access_token, status: r.audit_status, stage: r.audit_stage, error: r.audit_error,
      lob: r.lob, framework: r.framework, name: r.name, company: r.company, email: r.email,
      results: parseJson(r.results), transcript: parseJson(r.transcript),
    };
  },

  /** For the background worker. */
  async findAuditJob(id) {
    return one("SELECT id, lob, name, file_stored_name FROM demo_sessions WHERE id = ? AND type = 'audit'", [id]);
  },
  async setAuditStage(id, stage) {
    await exec('UPDATE demo_sessions SET audit_stage = ? WHERE id = ?', [stage, id]);
  },
  async completeAudit(id, { results, transcript }) {
    await exec("UPDATE demo_sessions SET audit_status = 'completed', audit_stage = NULL, audit_error = NULL, results = ?, transcript = ? WHERE id = ?", [toJson(results), toJson(transcript), id]);
  },
  async failAudit(id, technicalReason) {
    await exec("UPDATE demo_sessions SET audit_status = 'failed', audit_stage = NULL, audit_error = ? WHERE id = ?", [String(technicalReason).slice(0, 500), id]);
  },
  /** Jobs orphaned by a server restart would otherwise poll forever. */
  async failStaleAudits(olderThan) {
    const r = await exec("UPDATE demo_sessions SET audit_status = 'failed', audit_stage = NULL, audit_error = 'Interrupted (server restarted)' WHERE type = 'audit' AND audit_status = 'processing' AND created_at < ?", [olderThan]);
    return r.affectedRows;
  },
  /** Abuse guard: audits actually run (uploaded) by this email since `since`. Bare registrations don't count. */
  async countAuditsByEmailSince(email, since) {
    return (await one("SELECT COUNT(*) AS n FROM demo_sessions WHERE type = 'audit' AND email = ? AND created_at >= ? AND audit_status IN ('processing','completed','failed') AND file_original_name IS NOT NULL", [String(email).toLowerCase(), since])).n;
  },

  // ---------------------------------------------------------------- voice demo call (final step)
  /** Completes a registered voice session with the verified phone, consent and call outcome. */
  async completeVoice(id, d) {
    await exec(
      `UPDATE demo_sessions SET name = ?, company = ?, email = ?, phone = ?, industry = ?, call_type = ?, gender = ?, language = ?,
         consent = ?, call_status = ? WHERE id = ?`,
      [d.name, d.company, d.email, d.phone, d.industry, d.callType, d.gender, d.language, d.consent ? 1 : 0, d.callStatus, id]
    );
  },

  async createVoice(d) {
    const r = await exec(
      `INSERT INTO demo_sessions (type, name, company, email, phone, industry, call_type, gender, language, consent, call_status, ip)
       VALUES ('voice', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.name, d.company, d.email, d.phone, d.industry, d.callType, d.gender, d.language, d.consent ? 1 : 0, d.callStatus, d.ip || null]
    );
    return { id: r.insertId };
  },

  /** One free voice demo per number — only placed calls count, not step-1 registrations. */
  async voiceTrialUsed(phone) {
    return Boolean(await one("SELECT id FROM demo_sessions WHERE type = 'voice' AND phone = ? AND call_status <> 'registered' LIMIT 1", [phone]));
  },

  /** Audit demos whose recording is older than the retention window and still on disk. */
  expiredRecordings(cutoff) {
    return query("SELECT id, file_stored_name FROM demo_sessions WHERE type = 'audit' AND file_stored_name IS NOT NULL AND created_at < ?", [cutoff]);
  },
  async clearRecording(id) {
    await exec('UPDATE demo_sessions SET file_stored_name = NULL WHERE id = ?', [id]);
  },
};
