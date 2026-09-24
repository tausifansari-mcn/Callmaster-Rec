import { asyncHandler } from '../utils/ApiError.js';
import { toCsv } from '../utils/helpers.js';

/** Wires a repository's list / get / patch / delete / CSV export to HTTP handlers (shared by the admin inbox screens). */
export function handlers(repo, { csvColumns, cleanup, afterPatch } = {}) {
  return {
    list: asyncHandler(async (req, res) => res.json(await repo.list(req.query))),
    get: asyncHandler(async (req, res) => res.json(await repo.get(req.params.id))),
    update: asyncHandler(async (req, res) => {
      const updated = await repo.patch(req.params.id, req.body);
      if (afterPatch) await afterPatch(updated, req);
      res.json(updated);
    }),
    remove: asyncHandler(async (req, res) => {
      const doc = await repo.remove(req.params.id);
      cleanup?.(doc);
      res.json({ ok: true });
    }),
    exportCsv: asyncHandler(async (req, res) => {
      const rows = await repo.all(req.query);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${req.path.split('/')[1] || 'export'}-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(`﻿${toCsv(rows, csvColumns)}`);
    }),
  };
}
