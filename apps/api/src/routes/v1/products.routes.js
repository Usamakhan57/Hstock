import { Router } from 'express';
import {
  validate,
  requireAuth,
  optionalAuthenticate,
  requireRole,
  requirePermission,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  listProductsSchema,
  productIdOrSlugSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  moderateProductSchema,
} from '../../validators/product.validator.js';
import {
  replaceInventorySchema,
  listInventorySchema,
} from '../../validators/inventory.validator.js';
import * as productsController from '../../controllers/products/products.controller.js';
import * as inventoryController from '../../controllers/products/inventory.controller.js';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validate(listProductsSchema),
  productsController.listProducts,
);
/** Alias for public catalog clients expecting /products/public */
router.get(
  '/public',
  optionalAuthenticate,
  validate(listProductsSchema),
  productsController.listProducts,
);
router.get(
  '/:idOrSlug',
  optionalAuthenticate,
  validate(productIdOrSlugSchema),
  productsController.getProduct,
);

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate(createProductSchema),
  productsController.createProduct,
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate(updateProductSchema),
  productsController.updateProduct,
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate(productIdSchema),
  productsController.deleteProduct,
);

router.post(
  '/:id/submit',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(productIdSchema),
  productsController.submitProduct,
);

router.post(
  '/:id/moderate',
  requireAuth,
  requirePermission(PERMISSIONS.PRODUCTS_MODERATE),
  validate(moderateProductSchema),
  productsController.moderateProduct,
);

router.get(
  '/:id/inventory',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate(listInventorySchema),
  inventoryController.listInventory,
);

router.put(
  '/:id/inventory',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate(replaceInventorySchema),
  inventoryController.replaceInventory,
);

export default router;
