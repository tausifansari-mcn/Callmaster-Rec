import { Router } from 'express';
import * as pub from '../controllers/public.controller.js';
import * as demo from '../controllers/demo.controller.js';
import * as order from '../controllers/order.controller.js';
import * as auth from '../controllers/admin.auth.controller.js';
import * as res_ from '../controllers/admin.resource.controller.js';
import * as content from '../controllers/admin.content.controller.js';
import * as customer from '../controllers/customer.controller.js';
import * as appt from '../controllers/appointment.controller.js';
import * as wp from '../controllers/whitepaper.controller.js';
import {
  auditLimiter, formLimiter, loginLimiter, otpLimiter, requireAdmin, requireCustomer, requireSuperAdmin, uploadAudio, uploadHeroVideo, uploadLogo, uploadPdf, uploadScope, validate,
} from '../middleware/common.js';
import { quoteRequestSchema } from '../services/pricing.service.js';
import {
  appointmentSchema, cancelRequestSchema, customerLoginSchema, customerPasswordSchema, unlockSchema, whitepaperSchema,
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

router.post('/public/whitepapers/:slug/unlock', formLimiter, validate(unlockSchema), wp.unlockWhitepaper);
router.get('/public/whitepapers/download', wp.downloadWhitepaper);
router.get('/public/branding/logo', wp.getLogo);
router.get('/public/branding/hero-video', wp.getHeroVideo);
router.get('/public/appointments/slots', appt.slots);
router.post('/public/appointments', formLimiter, validate(appointmentSchema), appt.book);

router.post('/otp/send', otpLimiter, validate(otpSendSchema), pub.otpSend);
router.post('/otp/verify', otpLimiter, validate(otpVerifySchema), pub.otpVerify);

router.post('/demos/audit/register', formLimiter, validate(auditRegisterSchema), demo.registerAuditDemo);
router.post('/demos/audit/:id/submit', auditLimiter, uploadAudio, validate(auditSubmitSchema), demo.submitAuditDemo);
router.get('/demos/audit/:id', demo.getAuditStatus);
router.post('/demos/voice/register', formLimiter, validate(voiceRegisterSchema), demo.registerVoiceDemo);
router.post('/demos/voice', formLimiter, validate(voiceDemoSchema), demo.createVoiceDemo);

router.post('/checkout/quote', validate(quoteRequestSchema), order.quote);
router.post('/orders', formLimiter, uploadScope, order.createOrder);
router.post('/orders/cancel-request', formLimiter, validate(cancelRequestSchema), order.cancelRequest);
router.post('/orders/:orderId/cancel', formLimiter, validate(orderAccessSchema), order.cancelOrder);
router.post('/orders/:orderId/sandbox-pay', validate(orderAccessSchema), order.sandboxPay);
router.post('/orders/:orderId/verify', validate(razorpayVerifySchema), order.verifyRazorpay);

// ------------------------------------------------------------------ customer dashboard
const cust = Router();
cust.post('/login', loginLimiter, validate(customerLoginSchema), customer.login);
cust.get('/me', requireCustomer(true), customer.me);
cust.post('/change-password', requireCustomer(true), validate(customerPasswordSchema), customer.changePassword);
cust.get('/orders', requireCustomer(), customer.orders);
cust.post('/orders/:orderId/cancel', requireCustomer(), customer.cancelMyOrder);
router.use('/customer', cust);

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

mountResource('cancellations', wp.cancellationsResource);
mountResource('appointments', appt.appointmentsResource);
mountResource('whitepaper-leads', wp.whitepaperLeadsResource);
admin.get('/customers', wp.customersResource.list);
admin.get('/customers/:id', wp.customersResource.get);
admin.patch('/customers/:id/active', wp.setCustomerActive);
admin.post('/customers/:id/reset-password', wp.resetCustomerPassword);

admin.get('/whitepapers', wp.listWhitepapers);
admin.post('/whitepapers', validate(whitepaperSchema), wp.createWhitepaper);
admin.put('/whitepapers/:id', validate(whitepaperSchema), wp.updateWhitepaper);
admin.delete('/whitepapers/:id', wp.deleteWhitepaper);
admin.post('/whitepapers/:id/file', uploadPdf, wp.uploadWhitepaperPdf);
admin.delete('/whitepapers/:id/file', wp.removeWhitepaperPdf);

admin.post('/branding/logo', uploadLogo, wp.uploadLogoFile);
admin.delete('/branding/logo', wp.deleteLogo);
admin.post('/branding/hero-video', uploadHeroVideo, wp.uploadHeroVideoFile);
admin.delete('/branding/hero-video', wp.deleteHeroVideo);

admin.get('/settings', content.listSettings);
admin.post('/email/test', content.testEmail);
admin.get('/integrations/status', requireSuperAdmin, content.integrationStatus);
admin.post('/integrations/test', requireSuperAdmin, content.testIntegration);
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
