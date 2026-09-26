import { z } from 'zod';
import { GST_RE, PHONE_RE, isEmail, isOfficialEmail } from '../utils/helpers.js';
import { quoteRequestSchema } from '../services/pricing.service.js';

export const INDUSTRIES = ['Personal Care', 'FMCG', 'Automobiles', 'Financial Services', 'E-commerce'];
export const CALL_TYPES = ['Inbound', 'Outbound', 'Collections', 'Abandoned Cart Recovery', 'Renewals/Retention'];
export const VOICE_LANGUAGES = ['English', 'Hindi', 'Hinglish', 'British English', 'American English'];
export const AUDIT_CALL_TYPES = ['Inbound Support', 'Outbound Sales', 'Collections', 'Retention', 'A mix of the above'];
export const VOLUME_BANDS = ['Under 5,000 calls/month', '5,000–25,000 calls/month', '25,000–100,000 calls/month', '100,000+ calls/month'];
export const QA_SETUPS = ['Manual/sample-based QA today', 'Using another QA/analytics tool', 'No formal QA process today'];
export const CONTACT_INTERESTS = ['Deep Customer Insights', 'Voice Bot', 'Cloud Telephony', 'Enterprise'];

const text = (label, max = 200) => z.string({ required_error: `Enter ${label}` }).trim().min(1, `Enter ${label}`).max(max);
const email = z.string().trim().toLowerCase().refine(isEmail, 'Enter a valid email');
const officialEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isOfficialEmail, "Enter a valid work email — personal addresses (Gmail, Yahoo, etc.) aren't accepted");
const phone = z.string().trim().regex(PHONE_RE, 'Enter a valid 10-digit number');
const truthy = z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true');

export const contactSchema = z.object({
  name: text('your name'),
  organization: text('your organization'),
  email: officialEmail,
  phone,
  interest: z.enum(CONTACT_INTERESTS).optional().default('Deep Customer Insights'),
  message: z.string().trim().max(5000).optional().default(''),
});

export const leadSchema = z.object({
  name: text('your name'),
  organization: text('your organization'),
  email: officialEmail,
  phone,
  callType: z.enum(AUDIT_CALL_TYPES, { errorMap: () => ({ message: 'Select a call type' }) }),
  monthlyVolume: z.enum(VOLUME_BANDS, { errorMap: () => ({ message: 'Select a volume band' }) }),
  qaSetup: z.enum(QA_SETUPS, { errorMap: () => ({ message: 'Select an option' }) }),
});

export const otpSendSchema = z.discriminatedUnion('purpose', [
  z.object({ purpose: z.literal('checkout'), email: officialEmail }),
  z.object({ purpose: z.literal('audit-demo'), email }),
  z.object({ purpose: z.literal('voice-demo'), phone }),
]);

export const otpVerifySchema = z.object({
  purpose: z.enum(['checkout', 'voice-demo', 'audit-demo']),
  target: z.string().trim().toLowerCase().min(1),
  code: z.string().trim().regex(/^\d{4}$/, 'Enter the 4-digit code'),
});

const session = { id: z.coerce.number().int().positive().optional(), accessToken: z.string().max(64).optional() };

/** Step 1 of the Insights wizard — saved the moment the visitor clicks Continue. */
export const auditRegisterSchema = z.object({ name: text('your name'), company: text('your organization'), email, verifyToken: z.string().min(10, 'Verify your email first'), ...session });

/** Step 2 — the recording (multipart file) plus these fields, attached to the registered visitor. */
export const auditSubmitSchema = z.object({
  accessToken: z.string().min(1, 'Session expired — please start again'),
  lob: z.enum(['Inbound Support', 'Outbound Sales', 'Collections', 'Retention'], { errorMap: () => ({ message: 'Select a line of business' }) }),
  rights: truthy.refine((v) => v, 'Please confirm you have the right to submit this recording'),
});

/** Step 5 of the Voice Bot wizard — the bot configuration plus who is asking. */
export const voiceRegisterSchema = z.object({
  industry: z.enum(INDUSTRIES),
  callType: z.enum(CALL_TYPES),
  gender: z.enum(['Male', 'Female']),
  language: z.enum(VOICE_LANGUAGES),
  name: text('your name'),
  company: text('your organization'),
  email,
  ...session,
});

export const voiceDemoSchema = z.object({
  demoId: z.coerce.number().int().positive().optional(),
  demoToken: z.string().max(64).optional(),
  industry: z.enum(INDUSTRIES),
  callType: z.enum(CALL_TYPES),
  gender: z.enum(['Male', 'Female']),
  language: z.enum(VOICE_LANGUAGES),
  name: text('your name'),
  company: text('your organization'),
  email,
  phone,
  consent: truthy.refine((v) => v, 'Consent is required to place the demo call'),
  verifyToken: z.string().min(10),
});

export const orderSchema = quoteRequestSchema.extend({
  customer: z.object({
    company: text('your company name'),
    contact: text("the contact person's name"),
    gstNumber: z.string().trim().toUpperCase().regex(GST_RE, 'Enter a valid 15-character GST number'),
    phone,
    email: officialEmail,
  }),
  verifyToken: z.string().min(10),
  dpdpConsent: z.literal(true, { errorMap: () => ({ message: 'Please confirm you have read and understood this before continuing' }) }),
});

export const replySchema = z.object({ subject: z.string().trim().min(1, 'Enter a subject').max(200), message: z.string().trim().min(1, 'Enter a message').max(10000) });

export const orderAccessSchema = z.object({ accessToken: z.string().min(1) });

export const razorpayVerifySchema = orderAccessSchema.extend({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/** Admin-side */
export const adminLoginSchema = z.object({ email: email, password: z.string().min(1, 'Enter your password') });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(128),
});
export const adminUserSchema = z.object({
  name: text('a name', 80),
  email,
  role: z.enum(['superadmin', 'admin']).default('admin'),
  active: z.boolean().default(true),
  password: z.string().min(8, 'Use at least 8 characters').max(128).optional(),
});
export const promoSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'Code must be 3–30 letters/numbers'),
  percent: z.coerce.number().min(1).max(100),
  description: z.string().trim().max(200).optional().default(''),
  active: z.boolean().default(true),
  validFrom: z.coerce.date().nullish(),
  validUntil: z.coerce.date().nullish(),
  maxUses: z.coerce.number().int().min(0).default(0),
});
export const pageSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
  title: text('a title', 160),
  sections: z.array(z.object({ heading: z.string().trim().max(200).default(''), body: z.string().max(20000).default('') })).max(60),
  published: z.boolean().default(true),
  showInFooter: z.boolean().default(true),
  footerColumn: z.enum(['product', 'company', 'legal']).default('company'),
  order: z.coerce.number().int().min(0).max(1000).default(100),
});

/** Public: "Book a call" — the day and time must be one of the slots offered by GET /public/appointments/slots. */
export const appointmentSchema = z.object({
  name: text('your name'),
  organization: text('your organization'),
  email: officialEmail,
  phone,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a day'),
  time: z.string().trim().min(1, 'Pick a time').max(12),
  source: z.enum(['home', 'contact']).default('contact'),
});

/** Public: cancellation request form (Cloud Telephony) */
export const cancelRequestSchema = z.object({
  orderId: text('your order ID', 40),
  email,
});

/** Public: unlock a white paper */
export const unlockSchema = z.object({ name: text('your name'), email: officialEmail });

/** Customer dashboard */
export const customerLoginSchema = z.object({ login: text('your username or email', 190), password: z.string().min(1, 'Enter your password').max(200) });
export const customerPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(128),
});

/** Admin: white papers */
export const whitepaperSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes').max(80),
  title: text('a title', 190),
  description: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(1000).default(100),
});
