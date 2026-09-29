import { Admins } from '../repositories/admins.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { signAdminToken } from '../middleware/common.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { sendOtp, verifyOtp } from '../services/otp.service.js';

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

// ---------------------------------------------------------------- forgot password (no session required)
/**
 * Emails a 4-digit reset code if the address belongs to an active admin — but always answers the same way,
 * so the login page can never be used to find out which emails have admin accounts.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const admin = await Admins.findByEmail(email);
  if (admin && admin.active) {
    const result = await sendOtp({ target: email, purpose: 'admin-reset' });
    // Never echoed to the browser, even in sandbox mode: unlike a checkout email, an admin's address isn't
    // secret (it's shown as a contact address elsewhere on the site), so relaying the code here would let
    // anyone reset any admin's password. For local testing without SMTP set up, read it from this log line.
    if (result.devOtp) console.log(`[admin] password-reset code for ${email}: ${result.devOtp}`);
  }
  res.json({ ok: true });
});

/** Verifies the code and sets the new password in one step. Same wrong-code message whether or not the email matched. */
export const resetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  await verifyOtp({ target: email, purpose: 'admin-reset', code: req.body.code });
  const admin = await Admins.findByEmail(email);
  if (!admin || !admin.active) throw ApiError.badRequest("That code doesn't match. Try again.");
  await Admins.update(admin.id, { passwordHash: await hashPassword(req.body.newPassword) });
  res.json({ ok: true });
});
