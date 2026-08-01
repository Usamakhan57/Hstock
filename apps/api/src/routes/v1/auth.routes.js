import { Router } from 'express';
import passport from 'passport';
import {
  validate,
  requireAuth,
  authRateLimiter,
} from '../../middlewares/index.js';
import {
  registerBuyerSchema,
  registerSellerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth.validator.js';
import * as authController from '../../controllers/auth/auth.controller.js';
import { env } from '../../config/env.js';
import { configureGooglePassport } from '../../config/googlePassport.js';

configureGooglePassport();

const router = Router();

router.use(authRateLimiter);

router.post('/register', validate(registerBuyerSchema), authController.registerBuyer);
router.post('/login', validate(loginSchema), authController.loginBuyer);
router.post('/seller/register', validate(registerSellerSchema), authController.registerSeller);
router.post('/seller/login', validate(loginSchema), authController.loginSeller);
router.post('/admin/login', validate(loginSchema), authController.loginAdmin);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email', authController.verifyEmail);
router.get('/me', requireAuth, authController.me);

router.get('/google/status', authController.googleStatus);

router.get('/google', (req, res, next) => {
  if (!env.googleOAuthConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Google sign-in is not configured',
      data: null,
      errors: [{ code: 'GOOGLE_OAUTH_NOT_CONFIGURED' }],
      meta: null,
    });
  }
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const frontend = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!env.googleOAuthConfigured) {
    return res.redirect(`${frontend}/login?google=error&reason=not_configured`);
  }

  // Google denial / missing code should never restart the OAuth dance.
  if (!req.query.code || req.query.error) {
    return res.redirect(`${frontend}/login?google=error&reason=denied`);
  }

  // Custom callback so token exchange errors (invalid_grant, etc.) redirect
  // to the frontend instead of surfacing as a raw 500 Internal Server Error.
  return passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${frontend}/login?google=error&reason=denied`);
    }
    req.user = user;
    return authController.googleCallback(req, res, next);
  })(req, res, next);
});

export default router;
