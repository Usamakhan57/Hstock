import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as adminAnalyticsService from '../../services/adminAnalytics.service.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const data = await adminAnalyticsService.getDashboardOverview();
  return sendSuccess(res, { message: 'Admin dashboard overview', data });
});

export const analytics = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getAnalytics({
    days: req.query.days ? Number(req.query.days) : 30,
  });
  return sendSuccess(res, { message: 'Admin analytics', data });
});

export const ocrQueue = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getOcrReviewQueue({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 30,
  });
  return sendSuccess(res, {
    message: 'OCR review queue',
    data: data.items,
    meta: { ...data.meta, replacements: data.replacements },
  });
});

export const systemHealth = asyncHandler(async (_req, res) => {
  const data = await adminAnalyticsService.getSystemHealthDetailed();
  return sendSuccess(res, { message: 'System health', data });
});

export default {
  dashboard,
  analytics,
  ocrQueue,
  systemHealth,
};
