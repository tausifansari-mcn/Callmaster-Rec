import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { Admins } from '../repositories/admins.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { randomToken } from '../utils/helpers.js';

// ---------------------------------------------------------------- validation
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(zodToApiError(result.error));
  req[source] = result.data;
  return next();
};

function zodToApiError(err) {
  const fieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = err.issues[0];
  return ApiError.badRequest(first?.message || 'Invalid request', fieldErrors);
}

// ---------------------------------------------------------------- admin auth
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw ApiError.unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }
  if (payload.kind !== 'admin') throw ApiError.unauthorized();
  const admin = await Admins.findById(payload.sub);
  if (!admin || !admin.active) throw ApiError.unauthorized('Account is disabled or no longer exists.');
  req.admin = admin;
  next();
});

export const requireSuperAdmin = (req, _res, next) =>
  req.admin?.role === 'superadmin' ? next() : next(ApiError.forbidden('Only a super admin can do this'));

export const signAdminToken = (admin) =>
  jwt.sign({ sub: String(admin.id), kind: 'admin', role: admin.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// ---------------------------------------------------------------- rate limiting
const limiter = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    ...extra,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, message)),
  });

export const apiLimiter = limiter(15 * 60 * 1000, 600, 'Too many requests. Please slow down.');
// Only failed sign-ins count towards the limit, so a legitimate admin logging in repeatedly is never locked out.
export const loginLimiter = limiter(15 * 60 * 1000, 10, 'Too many failed login attempts. Try again in a few minutes.', { skipSuccessfulRequests: true });
export const otpLimiter = limiter(10 * 60 * 1000, 12, 'Too many verification requests. Try again later.');
// Each audit spends real Deepgram + Anthropic credits, so uploads are limited much harder than ordinary forms.
export const auditLimiter = limiter(60 * 60 * 1000, 6, 'Too many call uploads from this device. Please try again in an hour.');
export const formLimiter = limiter(60 * 60 * 1000, 30, 'Too many submissions from this device. Try again later.');

// ---------------------------------------------------------------- uploads
export const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.mpeg', '.mpga', '.ogg', '.aac', '.flac', '.amr', '.wma'];
export const DOC_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.ppt', '.pptx'];
export const UPLOAD_KINDS = { audio: 'audio', sow: 'sow' };

function makeUpload(kind, allowed, fieldName) {
  const dir = path.join(env.uploadDir, kind);
  fs.mkdirSync(dir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomToken(6)}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: env.uploadMaxMb * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) return cb(null, true);
      return cb(ApiError.badRequest(`Unsupported file type "${ext || 'unknown'}". Allowed: ${allowed.join(', ')}`));
    },
  }).single(fieldName);

  return (req, res, next) =>
    upload(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? `File is too large (max ${env.uploadMaxMb} MB)` : err.message;
        return next(ApiError.badRequest(msg));
      }
      return next(err);
    });
}

export const uploadAudio = makeUpload(UPLOAD_KINDS.audio, AUDIO_EXTS, 'file');
export const uploadScope = makeUpload(UPLOAD_KINDS.sow, DOC_EXTS, 'scopeOfWork');

export const fileMeta = (file) =>
  file ? { originalName: file.originalname, storedName: file.filename, size: file.size } : undefined;

export function removeUploaded(file) {
  if (file?.path) fs.promises.unlink(file.path).catch(() => {});
}

// ---------------------------------------------------------------- errors
export function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound('Endpoint not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof ZodError) {
    const e = zodToApiError(err);
    status = e.status; message = e.message; details = e.details;
  } else if (err.code === 'ER_DUP_ENTRY') {
    // e.g. "Duplicate entry 'x@y.com' for key 'admins.uq_admins_email'"
    const value = /Duplicate entry '(.*?)'/.exec(err.sqlMessage || '')?.[1];
    status = 409; message = value ? `"${value}" already exists` : 'That value already exists';
  } else if (err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_TRUNCATED_WRONG_VALUE') {
    status = 400; message = 'One of the values is too long or has an invalid format';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413; message = 'Request body too large';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    if (env.isProd) message = 'Something went wrong. Please try again.';
  }
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
