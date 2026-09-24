import crypto from 'node:crypto';
import { Customers } from '../repositories/customers.js';
import { Orders } from '../repositories/orders.js';
import { hashPassword } from './password.js';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alikes (0/O, 1/l/i)
const pick = () => ALPHABET[crypto.randomInt(ALPHABET.length)];

/** Temporary password shown once / emailed; the customer must change it at first sign-in. */
export const generateTempPassword = () => `Cm${Array.from({ length: 6 }, pick).join('')}${crypto.randomInt(10, 100)}!`;

const usernameBase = (email) => `${String(email).split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, '') || 'customer'}@callmaster-account`;

async function uniqueUsername(email) {
  const base = usernameBase(email);
  if (!(await Customers.usernameTaken(base))) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = base.replace('@', `${i}@`);
    if (!(await Customers.usernameTaken(candidate))) return candidate;
  }
  return base.replace('@', `${crypto.randomInt(1000, 99999)}@`);
}

/**
 * Called when an order is paid. First-time buyers get a dashboard account with a temporary password;
 * a returning buyer (same email) keeps their existing account and the new order is simply attached to it.
 * Returns { account, created, tempPassword } — tempPassword only when the account was just created.
 */
export async function ensureAccountForOrder(order) {
  const existing = await Customers.findByEmail(order.customer.email);
  if (existing) {
    await Orders.attachAccount(order.id, existing.id);
    return { account: existing, created: false, tempPassword: null };
  }
  const tempPassword = generateTempPassword();
  const account = await Customers.create({
    username: await uniqueUsername(order.customer.email),
    email: order.customer.email,
    company: order.customer.company,
    contactName: order.customer.contact,
    phone: order.customer.phone,
    passwordHash: await hashPassword(tempPassword),
  });
  await Orders.attachAccount(order.id, account.id);
  return { account, created: true, tempPassword };
}

/** Admin "reset password": issues a new temporary password and forces a change at next sign-in. */
export async function issueTempPassword(accountId) {
  const tempPassword = generateTempPassword();
  await Customers.setPassword(accountId, await hashPassword(tempPassword), true);
  return tempPassword;
}
