import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  createImageUploadMiddleware,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import * as uploadsController from '../../controllers/uploads/uploads.controller.js';

const router = Router();

const uploadProductImage = createImageUploadMiddleware({
  subdir: 'products',
  fieldName: 'file',
  maxCount: 1,
});

/**
 * Multipart product/media image upload.
 * Accepts JPG / PNG / WEBP up to 25 MB.
 */
router.post(
  '/images',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  uploadProductImage,
  uploadsController.uploadProductImage,
);

export default router;
