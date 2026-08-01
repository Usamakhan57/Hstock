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

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!env.googleOAuthConfigured) {
      const frontend = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      return res.redirect(`${frontend}/login?google=error&reason=not_configured`);
    }
    return passport.authenticate('google', {
      session: false,
      failureRedirect: `${(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/login?google=error&reason=denied`,
    })(req, res, next);
  },
  authController.googleCallback,
);

export default router;
