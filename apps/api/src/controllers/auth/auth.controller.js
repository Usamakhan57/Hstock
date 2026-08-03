import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as authService from '../../services/auth.service.js';

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const registerBuyer = asyncHandler(async (req, res) => {
  const result = await authService.registerBuyer(req.body, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Buyer registered successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      emailVerification: result.emailVerification,
    },
  });
});

export const registerSeller = asyncHandler(async (req, res) => {
  const result = await authService.registerSeller(req.body, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Seller registered successfully',
    data: {
      user: result.user,
      seller: result.seller,
      registration: result.registration,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      emailVerification: result.emailVerification,
    },
  });
});

export const loginBuyer = asyncHandler(async (req, res) => {
  const result = await authService.loginBuyer(req.body, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const loginSeller = asyncHandler(async (req, res) => {
  const result = await authService.loginSeller(req.body, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Seller login successful',
    data: {
      user: result.user,
      seller: result.seller,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await authService.loginAdmin(req.body, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Admin login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.[authService.REFRESH_COOKIE_NAME];
  const result = await authService.logout(token);
  authService.clearRefreshCookie(res);
  return sendSuccess(res, {
    message: 'Logged out successfully',
    data: result,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.[authService.REFRESH_COOKIE_NAME];
  const result = await authService.refreshSession(token, requestMeta(req));
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Token refreshed',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, {
    message: 'If that email exists, a reset link has been sent',
    data: result,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, {
    message: 'Password reset successful',
    data: result,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const result = await authService.verifyEmail(token);
  return sendSuccess(res, {
    message: 'Email verified successfully',
    data: result,
  });
});

export const me = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  return sendSuccess(res, {
    message: 'Current user',
    data: result,
  });
});

export const googleStatus = asyncHandler(async (_req, res) => {
  const { env } = await import('../../config/env.js');
  return sendSuccess(res, {
    message: 'Google OAuth status',
    data: {
      enabled: env.googleOAuthConfigured,
      callbackUrl: env.googleOAuthConfigured ? env.googleCallbackUrl : null,
    },
  });
});

export default {
  registerBuyer,
  registerSeller,
  loginBuyer,
  loginSeller,
  loginAdmin,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  me,
  googleStatus,
};
