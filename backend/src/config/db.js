import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { BACKEND_ROOT, env } from './env.js';

let pool;

export const getPool = () => {
  if (!pool) throw new Error('Database pool is not initialised — call connectDb() first');
  return pool;
};

const baseOptions = () => ({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
  charset: 'utf8mb4',
  timezone: 'Z', // all DATETIMEs are stored and read as UTC
  decimalNumbers: true, // DECIMAL columns come back as numbers, not strings
  dateStrings: false,
});

/** Runs database/schema.sql. Every statement is CREATE TABLE IF NOT EXISTS, so this is safe on every start. */
async function migrate(connection) {
  const file = path.join(BACKEND_ROOT, 'database', 'schema.sql');
  const statements = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) await connection.query(sql);
  await migrateColumns(connection);
  console.log(`[db] schema ready (${statements.length} tables checked)`);
}

/**
 * Columns added after the first release. CREATE TABLE IF NOT EXISTS can't alter a table that already exists, so
 * each addition is applied here, only when missing (checked against information_schema). Purely additive.
 */
const ADDED_COLUMNS = [
  { table: 'demo_sessions', column: 'audit_status', ddl: "ENUM('processing','completed','failed') NULL AFTER call_status" },
  { table: 'demo_sessions', column: 'audit_stage', ddl: 'VARCHAR(30) NULL AFTER audit_status' },
  { table: 'demo_sessions', column: 'audit_error', ddl: 'VARCHAR(500) NULL AFTER audit_stage' },
  { table: 'demo_sessions', column: 'access_token', ddl: 'VARCHAR(64) NULL AFTER audit_error' },
  { table: 'demo_sessions', column: 'transcript', ddl: 'LONGTEXT NULL AFTER results' },
  { table: 'orders', column: 'customer_account_id', ddl: 'BIGINT UNSIGNED NULL AFTER sow_size' },
  { table: 'orders', column: 'dpdp_consent_at', ddl: 'DATETIME(3) NULL AFTER customer_account_id' },
  { table: 'orders', column: 'welcome_offer', ddl: 'TINYINT(1) NOT NULL DEFAULT 0 AFTER dpdp_consent_at' },
  { table: 'orders', column: 'cancelled_at', ddl: 'DATETIME(3) NULL AFTER welcome_offer' },
];

async function migrateColumns(connection) {
  for (const { table, column, ddl } of ADDED_COLUMNS) {
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column]
    );
    if (!rows[0].n) {
      await connection.query('ALTER TABLE ?? ADD COLUMN ?? ' + ddl, [table, column]);
      console.log('[db] added column ' + table + '.' + column);
    }
  }
  // A visitor is saved as soon as they finish step 1 of a demo wizard, before any call is uploaded / placed.
  const enums = [
    { column: 'audit_status', ddl: "ENUM('registered','processing','completed','failed') NULL" },
    { column: 'call_status', ddl: "ENUM('registered','simulated','requested','failed') NOT NULL DEFAULT 'simulated'" },
  ];
  for (const { column, ddl } of enums) {
    const [[row]] = await connection.query(
      "SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demo_sessions' AND COLUMN_NAME = ?",
      [column]
    );
    if (row && !String(row.t).includes("'registered'")) {
      await connection.query('ALTER TABLE demo_sessions MODIFY COLUMN ?? ' + ddl, [column]);
      console.log('[db] demo_sessions.' + column + ' now allows "registered"');
    }
  }
  // The Insights wizard now verifies the visitor's email with a one-time code before saving them.
  const [[otp]] = await connection.query(
    "SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otps' AND COLUMN_NAME = 'purpose'"
  );
  if (otp && !String(otp.t).includes("'audit-demo'")) {
    await connection.query("ALTER TABLE otps MODIFY COLUMN purpose ENUM('checkout','voice-demo','audit-demo') NOT NULL");
    console.log('[db] otps.purpose now allows "audit-demo"');
  }
  // Audit reports can exceed TEXT's 64 KB limit.
  const [[res]] = await connection.query(
    "SELECT DATA_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demo_sessions' AND COLUMN_NAME = 'results'"
  );
  if (res && res.t !== 'longtext') {
    await connection.query('ALTER TABLE demo_sessions MODIFY COLUMN results LONGTEXT NULL');
    console.log('[db] widened demo_sessions.results to LONGTEXT');
  }
}

async function ensureDatabase() {
  const conn = await mysql.createConnection(baseOptions());
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } catch (err) {
    // Hosted databases often forbid CREATE DATABASE; that's fine as long as db_masmin already exists.
    console.warn(`[db] could not create database "${env.db.name}" (${err.code}) — assuming it already exists`);
  } finally {
    await conn.end();
  }
}

export async function connectDb() {
  try {
    if (env.db.autoMigrate) await ensureDatabase();
    pool = mysql.createPool({
      ...baseOptions(),
      database: env.db.name,
      waitForConnections: true,
      connectionLimit: env.db.connectionLimit,
      enableKeepAlive: true,
    });
    pool.on('connection', (c) => c.query("SET time_zone = '+00:00'"));
    const conn = await pool.getConnection();
    try {
      await conn.query("SET time_zone = '+00:00'");
      if (env.db.autoMigrate) await migrate(conn);
    } finally {
      conn.release();
    }
    console.log(`[db] connected to MySQL ${env.db.host}:${env.db.port}/${env.db.name}`);
  } catch (err) {
    const hint = {
      ER_ACCESS_DENIED_ERROR: 'wrong DB_USER / DB_PASSWORD',
      ER_BAD_DB_ERROR: `database "${env.db.name}" does not exist and could not be created`,
      ECONNREFUSED: `nothing is listening on ${env.db.host}:${env.db.port}`,
      ETIMEDOUT: `timed out reaching ${env.db.host}:${env.db.port} (firewall / wrong host?)`,
      ENOTFOUND: `host "${env.db.host}" not found`,
    }[err.code];
    const e = new Error(`Could not connect to MySQL: ${hint || err.message}\n  Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME in backend/.env`);
    e.isConfigError = true;
    throw e;
  }
}

export async function disconnectDb() {
  if (pool) await pool.end();
  pool = undefined;
}

// ---------------------------------------------------------------- query helpers
/** SELECT → array of rows. Uses client-side escaping so `LIMIT ?` and `IN (?)` behave. */
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** INSERT / UPDATE / DELETE → { insertId, affectedRows }. */
export async function exec(sql, params = []) {
  const [result] = await getPool().query(sql, params);
  return result;
}

export async function one(sql, params = []) {
  return (await query(sql, params))[0] || null;
}

export async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const run = async (sql, params = []) => (await conn.query(sql, params))[0];
    const result = await fn(run);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
