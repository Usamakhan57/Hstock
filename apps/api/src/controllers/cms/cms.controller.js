import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as cmsService from '../../services/cms.service.js';

export const getDocument = asyncHandler(async (req, res) => {
  const data = await cmsService.getCmsDocument(req.params.key);
  return sendSuccess(res, { message: 'CMS document', data });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const keys = typeof req.query.keys === 'string' && req.query.keys.trim()
    ? req.query.keys.split(',').map((k) => k.trim()).filter(Boolean)
    : undefined;
  const data = await cmsService.getCmsDocuments(keys);
  return sendSuccess(res, { message: 'CMS documents', data });
});

export const getVersions = asyncHandler(async (_req, res) => {
  const data = await cmsService.getCmsVersions();
  return sendSuccess(res, { message: 'CMS versions', data });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const data = await cmsService.updateCmsDocument(
    req.params.key,
    req.body?.data ?? req.body,
    req.user?.id || req.user?._id,
  );
  return sendSuccess(res, { message: 'CMS document updated', data });
});

export default {
  getDocument,
  getDocuments,
  getVersions,
  updateDocument,
};
