import { Admins } from '../repositories/admins.js';
import { Pages, RESERVED_SLUGS } from '../repositories/pages.js';
import { Promos } from '../repositories/promos.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { hashPassword } from '../services/password.js';
import { getAdminSettings, resetSetting, saveSetting, SETTING_KEYS } from '../services/settings.service.js';
import { getMailConfig, sendTestEmail } from '../services/mail.service.js';
import { isEmail } from '../utils/helpers.js';
import { checkPricingSemantics, settingsSchemas } from '../validators/settingsSchemas.js';

const found = (row) => {
  if (!row) throw ApiError.notFound();
  return row;
};

// ---------------------------------------------------------------- settings
export const listSettings = asyncHandler(async (_req, res) => res.json(await getAdminSettings()));

/** Sends a real test email using the saved settings, and reports the SMTP error if it fails. */
export const testEmail = asyncHandler(async (req, res) => {
  const to = String(req.body.to || req.admin.email).trim();
  if (!isEmail(to)) throw ApiError.badRequest('Enter a valid email address to send the test to');
  const cfg = await getMailConfig();
  if (!cfg.configured) throw ApiError.badRequest('Save the SMTP host (and login) first, then send the test.');
  const result = await sendTestEmail(to);
  if (!result.sent) throw ApiError.badRequest(`Could not send: ${result.reason}`);
  res.json({ ok: true, to, source: result.source });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!SETTING_KEYS.includes(key)) throw ApiError.notFound('Unknown setting');
  const parsed = settingsSchemas[key].safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw ApiError.badRequest(`${issue.path.join(' › ')}: ${issue.message}`, parsed.error.flatten());
  }
  if (key === 'pricing') {
    const problem = checkPricingSemantics(parsed.data);
    if (problem) throw ApiError.badRequest(problem);
  }
  res.json(await saveSetting(key, parsed.data, req.admin.email));
});

export const resetSettingToDefault = asyncHandler(async (req, res) => {
  if (!SETTING_KEYS.includes(req.params.key)) throw ApiError.notFound('Unknown setting');
  res.json(await resetSetting(req.params.key));
});

// ---------------------------------------------------------------- pages
export const listPages = asyncHandler(async (_req, res) => res.json(await Pages.list()));

export const getPage = asyncHandler(async (req, res) => res.json(found(await Pages.findById(req.params.id))));

export const createPage = asyncHandler(async (req, res) => {
  if (RESERVED_SLUGS.includes(req.body.slug)) throw ApiError.badRequest(`"${req.body.slug}" is reserved — choose another URL`);
  res.status(201).json(await Pages.create({ ...req.body, kind: 'custom' }));
});

export const updatePage = asyncHandler(async (req, res) => {
  const page = found(await Pages.findById(req.params.id));
  const data = { ...req.body, kind: page.kind };
  if (page.kind === 'legal') data.slug = page.slug; // legal URLs are linked from the checkout/footer — keep them stable
  else if (data.slug !== page.slug && RESERVED_SLUGS.includes(data.slug)) throw ApiError.badRequest(`"${data.slug}" is reserved — choose another URL`);
  res.json(await Pages.update(page.id, data));
});

export const deletePage = asyncHandler(async (req, res) => {
  const page = found(await Pages.findById(req.params.id));
  if (page.kind === 'legal') throw ApiError.badRequest('Built-in legal pages cannot be deleted — unpublish it instead');
  await Pages.remove(page.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- promo codes
export const listPromos = asyncHandler(async (_req, res) => res.json(await Promos.list()));

export const createPromo = asyncHandler(async (req, res) => res.status(201).json(await Promos.create(req.body)));

export const updatePromo = asyncHandler(async (req, res) => {
  found(await Promos.findById(req.params.id));
  res.json(await Promos.update(req.params.id, req.body));
});

export const deletePromo = asyncHandler(async (req, res) => {
  found(await Promos.findById(req.params.id));
  await Promos.remove(req.params.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- admin users (super admin only)
export const listUsers = asyncHandler(async (_req, res) => res.json(await Admins.list()));

export const createUser = asyncHandler(async (req, res) => {
  const { password, ...rest } = req.body;
  if (!password) throw ApiError.badRequest('Set an initial password (min 8 characters)');
  res.status(201).json(await Admins.create({ ...rest, passwordHash: await hashPassword(password) }));
});

async function assertAnotherSuperAdmin(excludeId) {
  if (!(await Admins.countOtherActiveSuperAdmins(excludeId))) throw ApiError.badRequest('At least one active super admin must remain');
}

export const updateUser = asyncHandler(async (req, res) => {
  const user = found(await Admins.findById(req.params.id));
  const { password, ...rest } = req.body;
  const losesSuper = user.role === 'superadmin' && ((rest.role !== undefined && rest.role !== 'superadmin') || rest.active === false);
  if (losesSuper) await assertAnotherSuperAdmin(user.id);
  res.json(await Admins.update(user.id, { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) }));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = found(await Admins.findById(req.params.id));
  if (String(user.id) === String(req.admin.id)) throw ApiError.badRequest("You can't delete your own account");
  if (user.role === 'superadmin') await assertAnotherSuperAdmin(user.id);
  await Admins.remove(user.id);
  res.json({ ok: true });
});
