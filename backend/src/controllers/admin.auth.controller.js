import { Admins } from '../repositories/admins.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { signAdminToken } from '../middleware/common.js';
import { hashPassword, verifyPassword } from '../services/password.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admins.findByEmail(email, true);
  // Same message for unknown email / wrong password / disabled so the form can't be used to enumerate accounts.
  if (!admin || !admin.active || !(await verifyPassword(password, admin.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  await Admins.touchLogin(admin.id);
  const { passwordHash, ...safe } = admin;
  res.json({ token: signAdminToken(admin), admin: safe });
});

export const me = (req, res) => res.json({ admin: req.admin });

export const changePassword = asyncHandler(async (req, res) => {
  const admin = await Admins.findById(req.admin.id, true);
  if (!(await verifyPassword(req.body.currentPassword, admin.passwordHash))) throw ApiError.badRequest('Current password is incorrect');
  await Admins.update(admin.id, { passwordHash: await hashPassword(req.body.newPassword) });
  res.json({ ok: true });
});
