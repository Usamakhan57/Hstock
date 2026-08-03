import { Router } from 'express';
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
import * as googleOAuthController from '../../controllers/auth/googleOAuth.controller.js';
import { configureGooglePassport } from '../../config/googlePassport.js';

configureGooglePassport();

const router = Router();

/** Browser Google OAuth navigations must never be JSON-rate-limited (PWA-safe). */
function authRateLimitUnlessGoogleBrowser(req, res, next) {
  if (
    req.method === 'GET'
    && (req.path === '/google' || req.path === '/google/callback' || req.path === '/google/status')
  ) {
    return next();
  }
  return authRateLimiter(req, res, next);
}

router.use(authRateLimitUnlessGoogleBrowser);

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
router.get('/google', googleOAuthController.startGoogleOAuth);
router.get('/google/callback', googleOAuthController.handleGoogleOAuthCallback);

export default router;
