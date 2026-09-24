import { Router } from 'express';
import * as pub from '../controllers/public.controller.js';
import * as demo from '../controllers/demo.controller.js';
import * as order from '../controllers/order.controller.js';
import * as auth from '../controllers/admin.auth.controller.js';
import * as res_ from '../controllers/admin.resource.controller.js';
import * as content from '../controllers/admin.content.controller.js';
import {
  auditLimiter, formLimiter, loginLimiter, otpLimiter, requireAdmin, requireSuperAdmin, uploadAudio, uploadScope, validate,
} from '../middleware/common.js';
import { quoteRequestSchema } from '../services/pricing.service.js';
import {
  replySchema, adminLoginSchema, adminUserSchema, auditRegisterSchema, auditSubmitSchema, voiceRegisterSchema, changePasswordSchema, contactSchema, leadSchema, orderAccessSchema,
  otpSendSchema, otpVerifySchema, pageSchema, promoSchema, razorpayVerifySchema, voiceDemoSchema,
} from '../validators/publicSchemas.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ------------------------------------------------------------------ public site
router.get('/public/config', pub.getConfig);
router.get('/public/pages/:slug', pub.getPage);
router.post('/public/contact', formLimiter, validate(contactSchema), pub.submitContact);
router.post('/public/leads', formLimiter, validate(leadSchema), pub.submitLead);

router.post('/otp/send', otpLimiter, validate(otpSendSchema), pub.otpSend);
router.post('/otp/verify', otpLimiter, validate(otpVerifySchema), pub.otpVerify);

router.post('/demos/audit/register', formLimiter, validate(auditRegisterSchema), demo.registerAuditDemo);
router.post('/demos/audit/:id/submit', auditLimiter, uploadAudio, validate(auditSubmitSchema), demo.submitAuditDemo);
router.get('/demos/audit/:id', demo.getAuditStatus);
router.post('/demos/voice/register', formLimiter, validate(voiceRegisterSchema), demo.registerVoiceDemo);
router.post('/demos/voice', formLimiter, validate(voiceDemoSchema), demo.createVoiceDemo);

router.post('/checkout/quote', validate(quoteRequestSchema), order.quote);
router.post('/orders', formLimiter, uploadScope, order.createOrder);
router.post('/orders/:orderId/sandbox-pay', validate(orderAccessSchema), order.sandboxPay);
router.post('/orders/:orderId/verify', validate(razorpayVerifySchema), order.verifyRazorpay);

// ------------------------------------------------------------------ admin
const admin = Router();
admin.post('/auth/login', loginLimiter, validate(adminLoginSchema), auth.login);
admin.use(requireAdmin);
admin.get('/auth/me', auth.me);
admin.post('/auth/change-password', validate(changePasswordSchema), auth.changePassword);

admin.get('/stats', res_.stats);
admin.get('/files/:kind/:filename', res_.downloadFile);

const mountResource = (path, r) => {
  admin.get(`/${path}/export.csv`, r.exportCsv);
  admin.get(`/${path}`, r.list);
  admin.get(`/${path}/:id`, r.get);
  admin.patch(`/${path}/:id`, r.update);
  admin.delete(`/${path}/:id`, r.remove);
};
mountResource('orders', res_.ordersResource);
mountResource('leads', res_.leadsResource);
mountResource('contacts', res_.contactsResource);
mountResource('demos', res_.demosResource);

admin.get('/settings', content.listSettings);
admin.post('/email/test', content.testEmail);
admin.post('/contacts/:id/reply', validate(replySchema), res_.replyToContact);
admin.put('/settings/:key', content.updateSetting);
admin.post('/settings/:key/reset', content.resetSettingToDefault);

admin.get('/pages', content.listPages);
admin.get('/pages/:id', content.getPage);
admin.post('/pages', validate(pageSchema), content.createPage);
admin.put('/pages/:id', validate(pageSchema), content.updatePage);
admin.delete('/pages/:id', content.deletePage);

admin.get('/promos', content.listPromos);
admin.post('/promos', validate(promoSchema), content.createPromo);
admin.put('/promos/:id', validate(promoSchema), content.updatePromo);
admin.delete('/promos/:id', content.deletePromo);

admin.get('/users', requireSuperAdmin, content.listUsers);
admin.post('/users', requireSuperAdmin, validate(adminUserSchema), content.createUser);
admin.put('/users/:id', requireSuperAdmin, validate(adminUserSchema.partial()), content.updateUser);
admin.delete('/users/:id', requireSuperAdmin, content.deleteUser);

router.use('/admin', admin);

export default router;
