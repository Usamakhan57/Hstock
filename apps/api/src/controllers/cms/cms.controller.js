import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as cmsService from '../../services/cms.service.js';

function parseKeys(query) {
  return typeof query.keys === 'string' && query.keys.trim()
    ? query.keys.split(',').map((k) => k.trim()).filter(Boolean)
    : undefined;
}

/** Public storefront — published keys only, drafts stripped. */
export const getDocument = asyncHandler(async (req, res) => {
  const data = await cmsService.getCmsDocument(req.params.key, { publicOnly: true });
  return sendSuccess(res, { message: 'CMS document', data });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const data = await cmsService.getCmsDocuments(parseKeys(req.query), { publicOnly: true });
  return sendSuccess(res, { message: 'CMS documents', data });
});

export const getVersions = asyncHandler(async (_req, res) => {
  const data = await cmsService.getCmsVersions({ publicOnly: true });
  return sendSuccess(res, { message: 'CMS versions', data });
});

/** Admin — full documents including drafts and email templates. */
export const getAdminDocument = asyncHandler(async (req, res) => {
  const data = await cmsService.getCmsDocument(req.params.key, { publicOnly: false, bypassCache: true });
  return sendSuccess(res, { message: 'CMS document', data });
});

export const getAdminDocuments = asyncHandler(async (req, res) => {
  const data = await cmsService.getCmsDocuments(parseKeys(req.query), { publicOnly: false });
  return sendSuccess(res, { message: 'CMS documents', data });
});

export const getAdminVersions = asyncHandler(async (_req, res) => {
  const data = await cmsService.getCmsVersions({ publicOnly: false });
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
  getAdminDocument,
  getAdminDocuments,
  getAdminVersions,
  updateDocument,
};
